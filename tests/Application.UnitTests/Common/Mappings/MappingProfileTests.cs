using AutoMapper;
using CleanArchitecture.Application.Common.Mappings;
using CleanArchitecture.Domain.Entities;
using FluentAssertions;
using NUnit.Framework;

namespace CleanArchitecture.Application.UnitTests.Common.Mappings;

public abstract class AbstractMapFromTestDto : IMapFrom<TodoItem>
{
}

public class ConcreteMapFromTestDto : AbstractMapFromTestDto
{
    public int Id { get; set; }
}

public class OpenGenericMapFromTestDto<T> : IMapFrom<T>
{
}

public class MappingProfileTests
{
    private static MapperConfiguration CreateConfiguration() =>
        new(cfg => cfg.AddProfile(new MappingProfile(typeof(AbstractMapFromTestDto).Assembly)));

    [Test]
    public void ShouldNotThrowWhenAssemblyContainsAbstractOrOpenGenericMapFromTypes()
    {
        FluentActions.Invoking(CreateConfiguration).Should().NotThrow();
    }

    [Test]
    public void ShouldHaveValidConfigurationWhenAssemblyContainsAbstractOrOpenGenericMapFromTypes()
    {
        var configuration = CreateConfiguration();

        configuration.Invoking(c => c.AssertConfigurationIsValid()).Should().NotThrow();
    }

    [Test]
    public void ShouldMapConcreteSubclassOfAbstractMapFromType()
    {
        var configuration = CreateConfiguration();

        configuration.FindTypeMapFor<TodoItem, ConcreteMapFromTestDto>().Should().NotBeNull();
    }

    [Test]
    public void ShouldNotMapAbstractMapFromType()
    {
        var configuration = CreateConfiguration();

        configuration.FindTypeMapFor<TodoItem, AbstractMapFromTestDto>().Should().BeNull();
    }
}
