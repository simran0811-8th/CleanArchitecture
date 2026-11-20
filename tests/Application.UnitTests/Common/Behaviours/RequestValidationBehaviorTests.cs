using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using CleanArchitecture.Application.Common.Behaviours;
using FluentValidation;
using MediatR;
using Shouldly;
using Xunit;
using ValidationException = CleanArchitecture.Application.Common.Exceptions.ValidationException;

namespace CleanArchitecture.Application.UnitTests.Common.Behaviours
{
    public class RequestValidationBehaviorTests
    {
        private const string ErrorMessage = "Title is already exists.";

        private class TestRequest : IRequest<string>
        {
            public string Title { get; set; }

            public bool IsValid { get; set; }
        }

        private class TestRequestValidator : AbstractValidator<TestRequest>
        {
            public CancellationToken ObservedToken { get; private set; }

            public TestRequestValidator()
            {
                RuleFor(r => r.Title)
                    .MustAsync(async (request, title, cancellationToken) =>
                    {
                        ObservedToken = cancellationToken;
                        await Task.Yield();
                        return request.IsValid;
                    })
                    .WithMessage(ErrorMessage);
            }
        }

        [Fact]
        public async Task Handle_FailingAsyncRule_ThrowsValidationExceptionAndDoesNotCallNext()
        {
            var behaviour = new RequestValidationBehavior<TestRequest, string>(
                new List<IValidator<TestRequest>> { new TestRequestValidator() });
            var nextCalls = 0;

            var exception = await Should.ThrowAsync<ValidationException>(() =>
                behaviour.Handle(
                    new TestRequest { Title = "Shopping", IsValid = false },
                    CancellationToken.None,
                    () =>
                    {
                        nextCalls++;
                        return Task.FromResult("handled");
                    }));

            exception.Failures.ShouldContainKey(nameof(TestRequest.Title));
            exception.Failures[nameof(TestRequest.Title)].ShouldContain(ErrorMessage);
            nextCalls.ShouldBe(0);
        }

        [Fact]
        public async Task Handle_PassingAsyncRule_CallsNextAndReturnsItsResponse()
        {
            var behaviour = new RequestValidationBehavior<TestRequest, string>(
                new List<IValidator<TestRequest>> { new TestRequestValidator() });
            var nextCalls = 0;

            var response = await behaviour.Handle(
                new TestRequest { Title = "Shopping", IsValid = true },
                CancellationToken.None,
                () =>
                {
                    nextCalls++;
                    return Task.FromResult("handled");
                });

            response.ShouldBe("handled");
            nextCalls.ShouldBe(1);
        }

        [Fact]
        public async Task Handle_PassesCancellationTokenToAsyncRule()
        {
            var validator = new TestRequestValidator();
            var behaviour = new RequestValidationBehavior<TestRequest, string>(
                new List<IValidator<TestRequest>> { validator });

            using (var cts = new CancellationTokenSource())
            {
                await behaviour.Handle(
                    new TestRequest { Title = "Shopping", IsValid = true },
                    cts.Token,
                    () => Task.FromResult("handled"));

                validator.ObservedToken.ShouldBe(cts.Token);
            }
        }
    }
}
