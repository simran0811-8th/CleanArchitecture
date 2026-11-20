import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { TodoComponent } from './todo.component';
import { TodoItemsClient, TodoListsClient, TodosVm } from '../web-api-client';

describe('TodoComponent', () => {
  let fixture: ComponentFixture<TodoComponent>;
  let component: TodoComponent;
  let listsSpy: jasmine.SpyObj<TodoListsClient>;
  let itemsSpy: jasmine.SpyObj<TodoItemsClient>;

  beforeEach(waitForAsync(() => {
    listsSpy = jasmine.createSpyObj('TodoListsClient', ['get', 'create', 'update', 'delete']);
    itemsSpy = jasmine.createSpyObj('TodoItemsClient', ['create', 'update', 'delete', 'updateItemDetails']);

    listsSpy.get.and.returnValue(of(TodosVm.fromJS({
      priorityLevels: [
        { value: 0, name: 'None' },
        { value: 1, name: 'Low' },
        { value: 2, name: 'Medium' },
        { value: 3, name: 'High' }
      ],
      lists: [
        { id: 1, title: 'Shopping', items: [{ id: 10, listId: 1, title: 'Milk', done: false, priority: 0 }] },
        { id: 2, title: 'Work', items: [] }
      ]
    })));
    itemsSpy.create.and.returnValue(of(11));

    TestBed.configureTestingModule({
      declarations: [TodoComponent],
      imports: [FormsModule],
      providers: [
        { provide: TodoListsClient, useValue: listsSpy },
        { provide: TodoItemsClient, useValue: itemsSpy }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TodoComponent);
    component = fixture.componentInstance;
  });

  it('loads lists and items', () => {
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(listsSpy.get).toHaveBeenCalledTimes(1);
    expect(el.querySelector('#todo-lists')?.textContent).toContain('Shopping');
    expect(el.querySelector('#todo-lists')?.textContent).toContain('Work');
    expect(el.querySelector('#todo-items')?.textContent).toContain('Milk');
    expect(el.querySelector('#todo-error')).toBeNull();
  });

  it('adds an item to the selected list', fakeAsync(() => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    (el.querySelector('#addItemButton') as HTMLButtonElement).click();
    fixture.detectChanges();
    tick(100); // flush the focus setTimeout
    fixture.detectChanges();

    const input = el.querySelector('#itemTitle1') as HTMLInputElement;
    expect(input).not.toBeNull();
    input.value = 'Bread';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(itemsSpy.create).toHaveBeenCalledWith(jasmine.objectContaining({ listId: 1, title: 'Bread' }));
    const titles = Array.from(el.querySelectorAll('.todo-item-title')).map(e => e.textContent?.trim());
    expect(titles).toContain('Bread');
    expect(component.selectedList?.items?.some(i => i.id === 11)).toBeTrue();
  }));
});
