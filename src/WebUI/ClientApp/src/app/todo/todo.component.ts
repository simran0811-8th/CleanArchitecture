import { Component, OnInit } from '@angular/core';
import {
  TodoListsClient, TodoItemsClient, TodosVm, TodoListDto, TodoItemDto,
  CreateTodoListCommand, UpdateTodoListCommand, CreateTodoItemCommand,
  UpdateTodoItemCommand, UpdateTodoItemDetailCommand
} from '../web-api-client';

@Component({
  selector: 'app-todo-component',
  templateUrl: './todo.component.html',
  styleUrls: ['./todo.component.scss']
})
export class TodoComponent implements OnInit {
  vm?: TodosVm;

  selectedList?: TodoListDto;
  selectedItem?: TodoItemDto;
  private originalTitle?: string;

  errorMessage?: string;

  newListEditor: { title?: string; error?: string } = {};
  listOptionsEditor: { id?: number; title?: string; error?: string } = {};
  itemDetailsEditor: { id?: number; listId?: number; priority?: number; note?: string } = {};

  newListModalOpen = false;
  listOptionsModalOpen = false;
  deleteListModalOpen = false;
  itemDetailsModalOpen = false;

  constructor(private listsClient: TodoListsClient, private itemsClient: TodoItemsClient) { }

  ngOnInit(): void {
    this.listsClient.get().subscribe(
      result => {
        this.errorMessage = undefined;
        this.vm = result;
        this.selectedList = result.lists?.[0];
      },
      error => {
        console.error(error);
        this.errorMessage = 'Failed to load todo lists.';
      }
    );
  }

  // Lists

  remainingItems(list: TodoListDto): number {
    return (list.items ?? []).filter(t => !t.done).length;
  }

  showNewListModal(): void {
    this.newListEditor = {};
    this.newListModalOpen = true;
    this.focus('title', 100);
  }

  newListCancelled(): void {
    this.newListModalOpen = false;
    this.newListEditor = {};
  }

  addList(): void {
    const title = this.newListEditor.title;

    this.listsClient.create({ title } as CreateTodoListCommand).subscribe(
      result => {
        const list = TodoListDto.fromJS({ id: result, title, items: [] });
        if (!this.vm) {
          this.vm = new TodosVm();
        }
        this.vm.lists = [...(this.vm.lists ?? []), list];
        this.selectedList = list;
        this.newListModalOpen = false;
        this.newListEditor = {};
      },
      error => {
        this.newListEditor.error = this.validationMessage(error, 'Title') ?? 'Failed to create the list.';
        this.focus('title', 100);
      }
    );
  }

  showListOptionsModal(): void {
    if (!this.selectedList) {
      return;
    }

    this.listOptionsEditor = {
      id: this.selectedList.id,
      title: this.selectedList.title
    };
    this.listOptionsModalOpen = true;
  }

  listOptionsCancelled(): void {
    this.listOptionsModalOpen = false;
    this.listOptionsEditor = {};
  }

  updateListOptions(): void {
    const list = this.selectedList;
    if (!list || list.id === undefined) {
      return;
    }

    const title = this.listOptionsEditor.title;

    this.listsClient.update(list.id, { id: list.id, title } as UpdateTodoListCommand).subscribe(
      () => {
        list.title = title;
        this.listOptionsModalOpen = false;
        this.listOptionsEditor = {};
      },
      error => {
        this.listOptionsEditor.error = this.validationMessage(error, 'Title') ?? 'Failed to update the list.';
      }
    );
  }

  confirmDeleteList(): void {
    this.listOptionsModalOpen = false;
    this.deleteListModalOpen = true;
  }

  deleteListCancelled(): void {
    this.deleteListModalOpen = false;
    this.listOptionsEditor = {};
  }

  deleteListConfirmed(): void {
    const list = this.selectedList;
    if (!list || list.id === undefined) {
      return;
    }

    this.listsClient.delete(list.id).subscribe(
      () => {
        this.deleteListModalOpen = false;
        this.listOptionsEditor = {};
        if (this.vm) {
          this.vm.lists = (this.vm.lists ?? []).filter(t => t.id !== list.id);
          this.selectedList = this.vm.lists[0];
        }
        this.selectedItem = undefined;
      },
      error => {
        console.error(error);
        this.deleteListModalOpen = false;
        this.errorMessage = 'Failed to delete the list.';
      }
    );
  }

  // Items

  addItem(): void {
    const list = this.selectedList;
    if (!list) {
      return;
    }

    const item = TodoItemDto.fromJS({
      id: 0,
      listId: list.id,
      priority: this.vm?.priorityLevels?.[0]?.value ?? 0,
      title: '',
      done: false
    });

    list.items = [...(list.items ?? []), item];
    this.selectedItem = item;
    this.focus('itemTitle' + (list.items.length - 1), 100);
  }

  editItem(item: TodoItemDto, inputId: string): void {
    this.selectedItem = item;
    this.originalTitle = item.title;
    this.focus(inputId, 100);
  }

  updateItem(item: TodoItemDto, pressedEnter: boolean = false): void {
    if (item !== this.selectedItem) {
      return;
    }

    if (!item.title?.trim()) {
      if (item.id) {
        // existing item: restore previous title, no API call
        item.title = this.originalTitle;
        this.selectedItem = undefined;
      } else {
        this.deleteItem(item);
      }
      return;
    }

    const isNewItem = item.id === 0;

    if (isNewItem) {
      this.itemsClient.create({ listId: item.listId, title: item.title } as CreateTodoItemCommand).subscribe(
        result => {
          item.id = result;
        },
        error => this.itemFailed(error, 'Failed to add the item.')
      );
    } else {
      this.itemsClient.update(item.id!, { id: item.id, title: item.title, done: item.done } as UpdateTodoItemCommand).subscribe(
        () => { },
        error => this.itemFailed(error, 'Failed to update the item.')
      );
    }

    this.selectedItem = undefined;

    if (isNewItem && pressedEnter) {
      this.addItem();
    }
  }

  toggleDone(item: TodoItemDto): void {
    if (item.id === undefined || item.id === 0) {
      return;
    }

    this.itemsClient.update(item.id, { id: item.id, title: item.title, done: item.done } as UpdateTodoItemCommand).subscribe(
      () => { },
      error => this.itemFailed(error, 'Failed to update the item.')
    );
  }

  showItemDetailsModal(item: TodoItemDto): void {
    this.itemDetailsEditor = {
      id: item.id,
      listId: item.listId,
      priority: item.priority,
      note: item.note
    };
    this.itemDetailsModalOpen = true;
  }

  itemDetailsCancelled(): void {
    this.itemDetailsModalOpen = false;
    this.itemDetailsEditor = {};
  }

  updateItemDetails(): void {
    const editor = this.itemDetailsEditor;
    const item = this.detailsItem();
    if (!item || editor.id === undefined) {
      return;
    }

    this.itemsClient.updateItemDetails(editor.id, {
      id: editor.id,
      listId: item.listId,
      priority: editor.priority,
      note: editor.note
    } as UpdateTodoItemDetailCommand).subscribe(
      () => {
        item.priority = editor.priority;
        item.note = editor.note;
        this.itemDetailsModalOpen = false;
        this.itemDetailsEditor = {};
      },
      error => this.itemFailed(error, 'Failed to update the item details.')
    );
  }

  /** Delete button of the item details modal: deletes the item being edited. */
  deleteItemFromDetails(): void {
    const item = this.detailsItem();
    if (item) {
      this.deleteItem(item);
    } else {
      this.itemDetailsCancelled();
    }
  }

  deleteItem(item: TodoItemDto): void {
    this.itemDetailsModalOpen = false;
    this.itemDetailsEditor = {};

    const list = this.selectedList;
    if (!list) {
      return;
    }

    if (this.selectedItem === item) {
      this.selectedItem = undefined;
    }

    if (!item.id) {
      list.items = (list.items ?? []).filter(t => t !== item);
    } else {
      this.itemsClient.delete(item.id).subscribe(
        () => {
          list.items = (list.items ?? []).filter(t => t.id !== item.id);
        },
        error => this.itemFailed(error, 'Failed to delete the item.')
      );
    }
  }

  // Helpers

  private detailsItem(): TodoItemDto | undefined {
    return (this.selectedList?.items ?? []).find(i => i.id === this.itemDetailsEditor.id);
  }

  private itemFailed(error: unknown, message: string): void {
    console.error(error);
    this.errorMessage = message;
  }

  /* Extracts the first validation message for a field from a SwaggerException (ValidationProblemDetails JSON). */
  private validationMessage(error: any, field: string): string | undefined {
    try {
      const body = typeof error?.response === 'string' ? JSON.parse(error.response) : error?.response;
      return body?.errors?.[field]?.[0];
    } catch {
      return undefined;
    }
  }

  private focus(elementId: string, delay: number): void {
    setTimeout(() => document.getElementById(elementId)?.focus(), delay);
  }
}
