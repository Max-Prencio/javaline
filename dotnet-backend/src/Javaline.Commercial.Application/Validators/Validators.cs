using FluentValidation;
using Javaline.Commercial.Application.DTOs;

namespace Javaline.Commercial.Application.Validators;

/// <summary>
/// Validates invoice creation with business rules for amounts and status.
/// </summary>
public class CreateInvoiceDtoValidator : AbstractValidator<CreateInvoiceDto>
{
    public CreateInvoiceDtoValidator()
    {
        RuleFor(x => x.Type)
            .NotEmpty().WithMessage("Invoice type is required.")
            .Must(t => t == "Factura" || t == "Nota de Crédito" || t == "Nota de Débito")
            .WithMessage("Type must be Factura, Nota de Crédito, or Nota de Débito.");

        RuleFor(x => x.Currency)
            .NotEmpty().WithMessage("Currency is required.")
            .Length(3).WithMessage("Currency must be a 3-letter ISO code.");

        RuleFor(x => x.Total)
            .GreaterThanOrEqualTo(0).WithMessage("Total cannot be negative.");

        RuleFor(x => x.Subtotal)
            .GreaterThanOrEqualTo(0).WithMessage("Subtotal cannot be negative.");

        RuleFor(x => x.DiscountAmount)
            .GreaterThanOrEqualTo(0).WithMessage("Discount cannot be negative.");

        RuleFor(x => x.Tax)
            .GreaterThanOrEqualTo(0).WithMessage("Tax cannot be negative.");

        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Status is required.");

        RuleFor(x => x.ClientName)
            .MaximumLength(256).WithMessage("Client name must not exceed 256 characters.");

        RuleFor(x => x.Notes)
            .MaximumLength(2000).WithMessage("Notes must not exceed 2000 characters.");
    }
}

/// <summary>
/// Validates invoice status transitions.
/// </summary>
public class UpdateInvoiceStatusDtoValidator : AbstractValidator<UpdateInvoiceStatusDto>
{
    public UpdateInvoiceStatusDtoValidator()
    {
        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Status is required.")
            .Must(s => s == "Draft" || s == "Sent" || s == "Paid" || s == "Overdue" || s == "Cancelled")
            .WithMessage("Invalid invoice status.");
    }
}

/// <summary>
/// Validates purchase order creation.
/// </summary>
public class CreatePurchaseOrderDtoValidator : AbstractValidator<CreatePurchaseOrderDto>
{
    public CreatePurchaseOrderDtoValidator()
    {
        RuleFor(x => x.Supplier)
            .NotEmpty().WithMessage("Supplier is required.")
            .MaximumLength(256);

        RuleFor(x => x.Item)
            .NotEmpty().WithMessage("Item description is required.")
            .MaximumLength(500);

        RuleFor(x => x.Qty)
            .GreaterThan(0).WithMessage("Quantity must be greater than zero.");

        RuleFor(x => x.Currency)
            .NotEmpty().WithMessage("Currency is required.")
            .Length(3).WithMessage("Currency must be a 3-letter ISO code.");

        RuleFor(x => x.Total)
            .GreaterThan(0).WithMessage("Total must be greater than zero.");

        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Status is required.");

        RuleFor(x => x.Notes)
            .MaximumLength(2000).WithMessage("Notes must not exceed 2000 characters.");
    }
}

/// <summary>
/// Validates purchase order item creation.
/// </summary>
public class CreatePurchaseOrderItemDtoValidator : AbstractValidator<CreatePurchaseOrderItemDto>
{
    public CreatePurchaseOrderItemDtoValidator()
    {
        RuleFor(x => x.OrderId)
            .NotEmpty().WithMessage("Order ID is required.");

        RuleFor(x => x.ProductName)
            .NotEmpty().WithMessage("Product name is required.")
            .MaximumLength(256);

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be greater than zero.");

        RuleFor(x => x.UnitPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Unit price cannot be negative.");

        RuleFor(x => x.Total)
            .GreaterThanOrEqualTo(0).WithMessage("Total cannot be negative.");
    }
}

/// <summary>
/// Validates inventory item creation.
/// </summary>
public class CreateInventoryItemDtoValidator : AbstractValidator<CreateInventoryItemDto>
{
    public CreateInventoryItemDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Product name is required.")
            .MaximumLength(256);

        RuleFor(x => x.Sku)
            .NotEmpty().WithMessage("SKU is required.")
            .MaximumLength(100);

        RuleFor(x => x.Price)
            .GreaterThanOrEqualTo(0).WithMessage("Price cannot be negative.");

        RuleFor(x => x.Cost)
            .GreaterThanOrEqualTo(0).WithMessage("Cost cannot be negative.");

        RuleFor(x => x.Stock)
            .GreaterThanOrEqualTo(0).WithMessage("Stock cannot be negative.");

        RuleFor(x => x.MinStock)
            .GreaterThanOrEqualTo(0).WithMessage("Minimum stock cannot be negative.");

        RuleFor(x => x.Category)
            .MaximumLength(100).WithMessage("Category must not exceed 100 characters.");

        RuleFor(x => x.Unit)
            .MaximumLength(50).WithMessage("Unit must not exceed 50 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description must not exceed 2000 characters.");
    }
}

/// <summary>
/// Validates stock movement registration.
/// </summary>
public class RegisterMovementDtoValidator : AbstractValidator<RegisterMovementDto>
{
    public RegisterMovementDtoValidator()
    {
        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Product ID is required.");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be greater than zero.");

        RuleFor(x => x.Type)
            .NotEmpty().WithMessage("Movement type is required.")
            .Must(t => t == "entry" || t == "exit" || t == "adjustment")
            .WithMessage("Type must be entry, exit, or adjustment.");

        RuleFor(x => x.Reason)
            .MaximumLength(500).WithMessage("Reason must not exceed 500 characters.");
    }
}

/// <summary>
/// Validates permission creation.
/// </summary>
public class CreatePermissionDtoValidator : AbstractValidator<CreatePermissionDto>
{
    public CreatePermissionDtoValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required.");

        RuleFor(x => x.Module)
            .NotEmpty().WithMessage("Module is required.")
            .MaximumLength(100);
    }
}

/// <summary>
/// Validates branch creation.
/// </summary>
public class CreateBranchDtoValidator : AbstractValidator<CreateBranchDto>
{
    public CreateBranchDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Branch name is required.")
            .MaximumLength(256);

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Invalid email format.")
            .When(x => !string.IsNullOrEmpty(x.Email));

        RuleFor(x => x.Phone)
            .MaximumLength(50).WithMessage("Phone must not exceed 50 characters.");

        RuleFor(x => x.Manager)
            .MaximumLength(256).WithMessage("Manager name must not exceed 256 characters.");
    }
}

/// <summary>
/// Validates tenant settings update.
/// </summary>
public class UpdateTenantSettingsDtoValidator : AbstractValidator<UpdateTenantSettingsDto>
{
    public UpdateTenantSettingsDtoValidator()
    {
        RuleFor(x => x.TenantId)
            .NotEmpty().WithMessage("Tenant ID is required.");

        RuleFor(x => x.Key)
            .NotEmpty().WithMessage("Setting key is required.")
            .MaximumLength(256);

        RuleFor(x => x.Value)
            .MaximumLength(4000).WithMessage("Value must not exceed 4000 characters.");
    }
}

/// <summary>
/// Validates survey creation.
/// </summary>
public class CreateSurveyDtoValidator : AbstractValidator<CreateSurveyDto>
{
    public CreateSurveyDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Survey title is required.")
            .MaximumLength(256);

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description must not exceed 2000 characters.");

        RuleFor(x => x.Questions)
            .NotEmpty().WithMessage("Questions are required.");

        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Status is required.");
    }
}

/// <summary>
/// Validates survey response submission.
/// </summary>
public class CreateSurveyResponseDtoValidator : AbstractValidator<CreateSurveyResponseDto>
{
    public CreateSurveyResponseDtoValidator()
    {
        RuleFor(x => x.SurveyId)
            .NotEmpty().WithMessage("Survey ID is required.");

        RuleFor(x => x.Answers)
            .NotEmpty().WithMessage("Answers are required.");
    }
}

/// <summary>
/// Validates employee creation.
/// </summary>
public class CreateEmployeeDtoValidator : AbstractValidator<CreateEmployeeDto>
{
    public CreateEmployeeDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Employee name is required.")
            .MaximumLength(256);

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Invalid email format.")
            .When(x => !string.IsNullOrEmpty(x.Email));

        RuleFor(x => x.Phone)
            .MaximumLength(50).WithMessage("Phone must not exceed 50 characters.");

        RuleFor(x => x.Department)
            .MaximumLength(100).WithMessage("Department must not exceed 100 characters.");

        RuleFor(x => x.Position)
            .MaximumLength(100).WithMessage("Position must not exceed 100 characters.");

        RuleFor(x => x.Salary)
            .GreaterThanOrEqualTo(0).WithMessage("Salary cannot be negative.")
            .When(x => x.Salary.HasValue);

        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Status is required.");
    }
}

/// <summary>
/// Validates payroll creation.
/// </summary>
public class CreatePayrollDtoValidator : AbstractValidator<CreatePayrollDto>
{
    public CreatePayrollDtoValidator()
    {
        RuleFor(x => x.EmployeeId)
            .NotEmpty().WithMessage("Employee ID is required.");

        RuleFor(x => x.PeriodStart)
            .NotEmpty().WithMessage("Period start is required.");

        RuleFor(x => x.PeriodEnd)
            .NotEmpty().WithMessage("Period end is required.")
            .GreaterThanOrEqualTo(x => x.PeriodStart)
            .WithMessage("Period end must be after period start.");

        RuleFor(x => x.GrossSalary)
            .GreaterThanOrEqualTo(0).WithMessage("Gross salary cannot be negative.");

        RuleFor(x => x.TotalDeductions)
            .GreaterThanOrEqualTo(0).WithMessage("Total deductions cannot be negative.");

        RuleFor(x => x.NetSalary)
            .GreaterThanOrEqualTo(0).WithMessage("Net salary cannot be negative.");

        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Status is required.");
    }
}

/// <summary>
/// Validates vacation request creation.
/// </summary>
public class CreateVacationDtoValidator : AbstractValidator<CreateVacationDto>
{
    public CreateVacationDtoValidator()
    {
        RuleFor(x => x.EmployeeId)
            .NotEmpty().WithMessage("Employee ID is required.");

        RuleFor(x => x.VacationType)
            .NotEmpty().WithMessage("Vacation type is required.")
            .MaximumLength(100);

        RuleFor(x => x.StartDate)
            .NotEmpty().WithMessage("Start date is required.");

        RuleFor(x => x.EndDate)
            .NotEmpty().WithMessage("End date is required.")
            .GreaterThanOrEqualTo(x => x.StartDate)
            .WithMessage("End date must be after start date.");

        RuleFor(x => x.TotalDays)
            .GreaterThan(0).WithMessage("Total days must be greater than zero.");

        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Status is required.");
    }
}

/// <summary>
/// Validates attendance record creation.
/// </summary>
public class CreateAttendanceDtoValidator : AbstractValidator<CreateAttendanceDto>
{
    public CreateAttendanceDtoValidator()
    {
        RuleFor(x => x.EmployeeId)
            .NotEmpty().WithMessage("Employee ID is required.");

        RuleFor(x => x.Date)
            .NotEmpty().WithMessage("Date is required.");

        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Status is required.");

        RuleFor(x => x.TotalHours)
            .GreaterThanOrEqualTo(0).WithMessage("Total hours cannot be negative.");
    }
}

/// <summary>
/// Validates performance evaluation creation.
/// </summary>
public class CreatePerformanceEvaluationDtoValidator : AbstractValidator<CreatePerformanceEvaluationDto>
{
    public CreatePerformanceEvaluationDtoValidator()
    {
        RuleFor(x => x.EmployeeId)
            .NotEmpty().WithMessage("Employee ID is required.");

        RuleFor(x => x.Score)
            .GreaterThanOrEqualTo(0).WithMessage("Score cannot be negative.");

        RuleFor(x => x.MaxScore)
            .GreaterThan(0).WithMessage("Max score must be greater than zero.");

        RuleFor(x => x.Score)
            .LessThanOrEqualTo(x => x.MaxScore)
            .WithMessage("Score cannot exceed max score.");

        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Status is required.");

        RuleFor(x => x.CriteriaScores)
            .NotEmpty().WithMessage("Criteria scores are required.");
    }
}

/// <summary>
/// Validates ATS candidate creation.
/// </summary>
public class CreateATSCandidateDtoValidator : AbstractValidator<CreateATSCandidateDto>
{
    public CreateATSCandidateDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Candidate name is required.")
            .MaximumLength(256);

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Invalid email format.")
            .When(x => !string.IsNullOrEmpty(x.Email));

        RuleFor(x => x.Phone)
            .MaximumLength(50).WithMessage("Phone must not exceed 50 characters.");

        RuleFor(x => x.PositionApplied)
            .MaximumLength(256).WithMessage("Position must not exceed 256 characters.");

        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Status is required.");
    }
}
