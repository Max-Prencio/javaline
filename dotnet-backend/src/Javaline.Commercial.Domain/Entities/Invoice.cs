using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("invoices")]
public class Invoice : BaseEntity
{
    [Key]
    [Column("id")]
    public new string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("type")]
    public string Type { get; set; } = string.Empty;

    [Column("client_name")]
    public string? ClientName { get; set; }

    [Column("client_id")]
    public string? ClientId { get; set; }

    [Column("rnc")]
    public string? Rnc { get; set; }

    [Column("date")]
    public DateTime Date { get; set; } = DateTime.UtcNow;

    [Column("due_date")]
    public DateTime? DueDate { get; set; }

    [Column("currency")]
    public string Currency { get; set; } = "DOP";

    [Column("payment_type")]
    public string? PaymentType { get; set; }

    [Column("payment_method")]
    public string? PaymentMethod { get; set; }

    [Column("items")]
    public string Items { get; set; } = "[]";

    [Column("subtotal")]
    public decimal Subtotal { get; set; }

    [Column("discount")]
    public decimal Discount { get; set; }

    [Column("discount_type")]
    public string? DiscountType { get; set; }

    [Column("discount_amount")]
    public decimal DiscountAmount { get; set; }

    [Column("taxable_base")]
    public decimal TaxableBase { get; set; }

    [Column("tax_rate_id")]
    public string? TaxRateId { get; set; }

    [Column("tax")]
    public decimal Tax { get; set; }

    [Column("total")]
    public decimal Total { get; set; }

    [Column("status")]
    public string Status { get; set; } = "Pending";

    [Column("notes")]
    public string? Notes { get; set; }

    [Column("installment_plan")]
    public string? InstallmentPlan { get; set; }

    [Column("cash_register_id")]
    public string? CashRegisterId { get; set; }

    [Column("amount_received")]
    public decimal? AmountReceived { get; set; }

    [Column("change_returned")]
    public decimal? ChangeReturned { get; set; }

    [Column("rectifies_id")]
    public string? RectifiesId { get; set; }

    [Column("created_by")]
    public string? CreatedBy { get; set; }

    [Column("paid_at")]
    public DateTime? PaidAt { get; set; }
}
