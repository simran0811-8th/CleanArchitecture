using CleanArchitecture.Application.Common.Models;
using FluentAssertions;
using NUnit.Framework;
using System.Collections.Generic;

namespace CleanArchitecture.Application.UnitTests.Common.Models
{
    public class PaginatedListTests
    {
        [TestCase(0, 1, false)]
        [TestCase(0, 2, false)]
        [TestCase(30, 1, false)]
        [TestCase(30, 2, true)]
        [TestCase(30, 3, true)]
        [TestCase(25, 3, true)]
        [TestCase(30, 10, false)]
        public void HasPreviousPageReflectsPageIndexWithinRange(int count, int pageIndex, bool expected)
        {
            var list = new PaginatedList<int>(new List<int>(), count, pageIndex, 10);

            list.HasPreviousPage.Should().Be(expected);
        }
    }
}
