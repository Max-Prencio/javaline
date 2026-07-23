using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("cash_registers")]
public class CashRegister : BaseEntity
{
    [Key]
    [Column("id")]
    public new string Id { get; set; } = string.Empty;

    [Column("user_id")]
    public string UserId { get; set; } = string.Empty;

    [Column("open_date")]
    public DateTime OpenDate { get; set; }

    [Column("close_date")]
    public DateTime? CloseDate { get; set; }

    [Column("initial_balance")]
    public decimal InitialBalance { get; set; }

    [Column("current_balance")]
    public decimal CurrentBalance { get; set; }

    [Column("total_income")]
    public decimal TotalIncome { get; set; }

    [Column("total_expense")]
    public decimal TotalExpense { get; set; }

    [Column("status")]
    public string Status { get; set; } = "open";

    [Column("currency")]
    public string Currency { get; set; } = "DOP";

    [Column("transactions")]
    public string Transactions { get; set; } = "[]";
}
