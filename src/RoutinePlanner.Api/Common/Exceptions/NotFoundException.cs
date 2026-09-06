namespace RoutinePlanner.Api.Common.Exceptions;
public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }
    public static NotFoundException For<T>(object key) =>
        new($"{typeof(T).Name} с id={key} не найден");
}