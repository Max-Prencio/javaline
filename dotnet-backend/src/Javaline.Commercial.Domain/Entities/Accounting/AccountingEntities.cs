using System.ComponentModel.DataAnnotations;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

public class ChartAccount : BaseEntity
{
    [MaxLength(20)] public string Code { get; set; } = string.Empty;
    [MaxLength(200)] public string Name { get; set; } = string.Empty;
    [MaxLength(20)] public string Type { get; set; } = string.Empty;
    [MaxLength(50)] public string? ParentCode { get; set; }
    public int Level { get; set; } = 1;
    public bool Active { get; set; } = true;
    [MaxLength(500)] public string? Description { get; set; }
    public string TenantId { get; set; } = string.Empty;
}

public class JournalEntry : BaseEntity
{
    public DateTime Date { get; set; }
    [MaxLength(50)] public string Reference { get; set; } = string.Empty;
    [MaxLength(500)] public string Description { get; set; } = string.Empty;
    [MaxLength(20)] public string Status { get; set; } = "draft";
    public decimal TotalDebit { get; set; }
    public decimal TotalCredit { get; set; }
    public string? ReversesId { get; set; }
    public string TenantId { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = string.Empty;
    public string LinesJson { get; set; } = "[]";
}

public class AccountsReceivable : BaseEntity
{
    [MaxLength(200)] public string ClientName { get; set; } = string.Empty;
    [MaxLength(20)] public string? Rnc { get; set; }
    [MaxLength(50)] public string? Ncf { get; set; }
    public DateTime Date { get; set; }
    public DateTime? DueDate { get; set; }
    public decimal Amount { get; set; }
    public decimal Paid { get; set; } = 0;
    [MaxLength(20)] public string Status { get; set; } = "pending";
    public string? InvoiceId { get; set; }
    public string TenantId { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = string.Empty;
    public string PaymentsJson { get; set; } = "[]";
}

public class AccountsPayable : BaseEntity
{
    [MaxLength(200)] public string SupplierName { get; set; } = string.Empty;
    [MaxLength(20)] public string? Rnc { get; set; }
    [MaxLength(50)] public string? Ncf { get; set; }
    public DateTime Date { get; set; }
    public DateTime? DueDate { get; set; }
    public decimal Amount { get; set; }
    public decimal Paid { get; set; } = 0;
    [MaxLength(20)] public string Status { get; set; } = "pending";
    public string? PurchaseOrderId { get; set; }
    public string TenantId { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = string.Empty;
    public string PaymentsJson { get; set; } = "[]";
}

public class DebitNote : BaseEntity
{
    [MaxLength(20)] public string Ncf { get; set; } = string.Empty;
    [MaxLength(20)] public string NcfType { get; set; } = "B34";
    [MaxLength(20)] public string PartyType { get; set; } = "client";
    [MaxLength(200)] public string PartyName { get; set; } = string.Empty;
    [MaxLength(20)] public string? PartyRnc { get; set; }
    [MaxLength(50)] public string? OriginalNcf { get; set; }
    [MaxLength(500)] public string Concept { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal Itbis { get; set; } = 0;
    public DateTime Date { get; set; }
    [MaxLength(20)] public string Status { get; set; } = "active";
    public string TenantId { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = string.Empty;
}

public class CreditNote : BaseEntity
{
    [MaxLength(20)] public string Ncf { get; set; } = string.Empty;
    [MaxLength(20)] public string NcfType { get; set; } = "B04";
    [MaxLength(20)] public string PartyType { get; set; } = "client";
    [MaxLength(200)] public string PartyName { get; set; } = string.Empty;
    [MaxLength(20)] public string? PartyRnc { get; set; }
    [MaxLength(50)] public string? OriginalNcf { get; set; }
    [MaxLength(500)] public string Concept { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal Itbis { get; set; } = 0;
    public DateTime Date { get; set; }
    [MaxLength(20)] public string Status { get; set; } = "active";
    public string TenantId { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = string.Empty;
}

public class CheckRecord : BaseEntity
{
    [MaxLength(50)] public string Number { get; set; } = string.Empty;
    [MaxLength(20)] public string Type { get; set; } = "emitido";
    [MaxLength(100)] public string Bank { get; set; } = string.Empty;
    [MaxLength(200)] public string Payee { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    [MaxLength(10)] public string Currency { get; set; } = "DOP";
    public DateTime Date { get; set; }
    [MaxLength(500)] public string Concept { get; set; } = string.Empty;
    [MaxLength(20)] public string Status { get; set; } = "pendiente";
    public string TenantId { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = string.Empty;
}

public class PettyCashFund : BaseEntity
{
    [MaxLength(200)] public string Name { get; set; } = string.Empty;
    public decimal InitialBalance { get; set; }
    public decimal CurrentBalance { get; set; }
    [MaxLength(10)] public string Currency { get; set; } = "DOP";
    public bool Active { get; set; } = true;
    public string TenantId { get; set; } = string.Empty;
}

public class PettyCashMovement : BaseEntity
{
    public string FundId { get; set; } = string.Empty;
    [MaxLength(20)] public string Type { get; set; } = "egreso";
    [MaxLength(500)] public string Concept { get; set; } = string.Empty;
    [MaxLength(100)] public string? Category { get; set; }
    public decimal Amount { get; set; }
    public decimal BalanceAfter { get; set; }
    [MaxLength(100)] public string? Receipt { get; set; }
    public DateTime Date { get; set; }
    public string TenantId { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = string.Empty;
}

public class FixedAsset : BaseEntity
{
    [MaxLength(200)] public string Name { get; set; } = string.Empty;
    [MaxLength(50)] public string Category { get; set; } = string.Empty;
    public DateTime AcquisitionDate { get; set; }
    public decimal AcquisitionCost { get; set; }
    public int UsefulLifeYears { get; set; }
    [MaxLength(20)] public string DepreciationMethod { get; set; } = "lineal";
    public decimal SalvageValue { get; set; } = 0;
    [MaxLength(200)] public string? Location { get; set; }
    [MaxLength(100)] public string? SerialNumber { get; set; }
    [MaxLength(20)] public string Status { get; set; } = "active";
    public DateTime? DisposalDate { get; set; }
    public decimal? DisposalPrice { get; set; }
    [MaxLength(200)] public string? DisposalReason { get; set; }
    public string TenantId { get; set; } = string.Empty;
}

public class NcfSequence : BaseEntity
{
    [MaxLength(10)] public string NcfType { get; set; } = string.Empty;
    [MaxLength(100)] public string Name { get; set; } = string.Empty;
    public long CurrentSequence { get; set; } = 1;
    public long MaxSequence { get; set; } = 9999999;
    public bool Active { get; set; } = true;
    public string TenantId { get; set; } = string.Empty;
}

public class IncomeRecord : BaseEntity
{
    public DateTime Date { get; set; }
    [MaxLength(50)] public string Type { get; set; } = "venta";
    [MaxLength(500)] public string Concept { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal Itbis { get; set; } = 0;
    [MaxLength(50)] public string? Ncf { get; set; }
    [MaxLength(50)] public string? AccountCode { get; set; }
    public string TenantId { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = string.Empty;
}

public class CostRecord : BaseEntity
{
    public DateTime Date { get; set; }
    [MaxLength(50)] public string Type { get; set; } = "administrativo";
    [MaxLength(500)] public string Concept { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal Itbis { get; set; } = 0;
    [MaxLength(50)] public string? SupplierNcf { get; set; }
    [MaxLength(50)] public string? AccountCode { get; set; }
    public string TenantId { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = string.Empty;
}

public class CashReconciliation : BaseEntity
{
    public DateTime Date { get; set; }
    public string? CashRegisterId { get; set; }
    public decimal OpeningBalance { get; set; }
    public decimal TotalIncome { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal TheoreticalBalance { get; set; }
    public decimal ActualCash { get; set; }
    public decimal Difference { get; set; }
    [MaxLength(20)] public string Status { get; set; } = "cuadrado";
    [MaxLength(500)] public string? Notes { get; set; }
    public string TenantId { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = string.Empty;
}
