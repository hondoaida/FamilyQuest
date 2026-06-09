using FamilyQuestWebApi.Models.Entities;

public class ParentChild
{
    public int Id { get; set; }

    public int ParentId { get; set; }
    public User Parent { get; set; } = null!;

    public int ChildId { get; set; }
    public User Child { get; set; } = null!;
}