namespace RoutinePlanner.Api.Common.Exceptions;
public class ForbiddenException : Exception
{
    public ForbiddenException(string message = "Нет доступа") : base(message) { }
}