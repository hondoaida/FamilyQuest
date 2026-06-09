using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FamilyQuestWebApi.Migrations
{
    /// <inheritdoc />
    public partial class DueDateMigrationChange : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "RokIzvrsenja",
                table: "Tasks",
                newName: "DueDate");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "DueDate",
                table: "Tasks",
                newName: "RokIzvrsenja");
        }
    }
}
