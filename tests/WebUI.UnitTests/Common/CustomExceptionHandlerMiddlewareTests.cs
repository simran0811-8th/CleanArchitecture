using CleanArchitecture.Application.Common.Exceptions;
using CleanArchitecture.WebUI.Common;
using FluentValidation.Results;
using Microsoft.AspNetCore.Http;
using Shouldly;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace CleanArchitecture.WebUI.UnitTests.Common
{
    public class CustomExceptionHandlerMiddlewareTests
    {
        private const string ProblemJson = "application/problem+json";

        private static async Task<(HttpContext Context, string Raw, JsonDocument Json)> InvokeAsync(Exception ex)
        {
            var ctx = new DefaultHttpContext();
            ctx.Response.Body = new MemoryStream();

            await new CustomExceptionHandlerMiddleware(_ => throw ex).Invoke(ctx);

            ctx.Response.Body.Seek(0, SeekOrigin.Begin);
            string body = await new StreamReader(ctx.Response.Body).ReadToEndAsync();

            return (ctx, body, JsonDocument.Parse(body));
        }

        private static void AssertProblemShape(JsonElement root, int status)
        {
            root.ValueKind.ShouldBe(JsonValueKind.Object);

            root.GetProperty("type").ValueKind.ShouldBe(JsonValueKind.String);
            root.GetProperty("type").GetString().ShouldNotBeNullOrWhiteSpace();
            root.GetProperty("title").ValueKind.ShouldBe(JsonValueKind.String);
            root.GetProperty("title").GetString().ShouldNotBeNullOrWhiteSpace();
            root.GetProperty("status").ValueKind.ShouldBe(JsonValueKind.Number);
            root.GetProperty("status").GetInt32().ShouldBe(status);

            foreach (var wrongCase in new[] { "Type", "Title", "Status", "extensions", "Extensions" })
            {
                root.TryGetProperty(wrongCase, out _).ShouldBeFalse(wrongCase);
            }
        }

        [Fact]
        public async Task NotFound_ReturnsProblemDetails()
        {
            var (ctx, _, json) = await InvokeAsync(new NotFoundException("TodoItem", 99));

            ctx.Response.StatusCode.ShouldBe(404);
            ctx.Response.ContentType.ShouldBe(ProblemJson);
            AssertProblemShape(json.RootElement, 404);
            json.RootElement.GetProperty("detail").GetString().ShouldContain("TodoItem");
        }

        [Fact]
        public async Task UnhandledException_ReturnsProblemDetails()
        {
            var (ctx, raw, json) = await InvokeAsync(new InvalidOperationException("sensitive detail"));

            ctx.Response.StatusCode.ShouldBe(500);
            ctx.Response.ContentType.ShouldBe(ProblemJson);
            AssertProblemShape(json.RootElement, 500);
            json.RootElement.TryGetProperty("detail", out _).ShouldBeFalse();
            raw.ShouldNotContain("sensitive detail");
        }

        [Fact]
        public async Task ValidationException_ReturnsValidationProblemDetails()
        {
            var failures = new List<ValidationFailure>
            {
                new ValidationFailure("Title", "Title is required.")
            };

            var (ctx, _, json) = await InvokeAsync(new ValidationException(failures));

            ctx.Response.StatusCode.ShouldBe(400);
            ctx.Response.ContentType.ShouldBe(ProblemJson);
            AssertProblemShape(json.RootElement, 400);

            var errors = json.RootElement.GetProperty("errors");
            errors.ValueKind.ShouldBe(JsonValueKind.Object);
            var titleErrors = errors.GetProperty("Title");
            titleErrors.ValueKind.ShouldBe(JsonValueKind.Array);
            titleErrors.EnumerateArray().Select(e => e.GetString()).ShouldContain("Title is required.");
        }
    }
}
