using FluentAssertions;
using Javaline.Commercial.Application.DTOs;
using Javaline.Commercial.Application.Interfaces;
using Javaline.Commercial.Application.Validators;
using Xunit;

namespace Javaline.Commercial.Tests.Validators;

public class LoginRequestValidatorTests
{
    private readonly LoginRequestValidator _validator = new();

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void Should_Fail_When_Email_Is_Empty(string? email)
    {
        var request = new LoginRequest { Email = email!, Password = "Password1!" };
        var result = _validator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(LoginRequest.Email));
    }

    [Theory]
    [InlineData("notanemail")]
    [InlineData("@domain.com")]
    [InlineData("user@")]
    public void Should_Fail_When_Email_Is_Invalid(string email)
    {
        var request = new LoginRequest { Email = email, Password = "Password1!" };
        var result = _validator.Validate(request);
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Should_Pass_With_Valid_Credentials()
    {
        var request = new LoginRequest { Email = "user@test.com", Password = "Password1!" };
        var result = _validator.Validate(request);
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void Should_Fail_When_Password_Is_Empty(string? password)
    {
        var request = new LoginRequest { Email = "user@test.com", Password = password! };
        var result = _validator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(LoginRequest.Password));
    }
}

public class RegisterRequestValidatorTests
{
    private readonly RegisterRequestValidator _validator = new();

    [Fact]
    public void Should_Pass_With_Valid_Registration()
    {
        var request = new RegisterRequest
        {
            Email = "new@test.com",
            Name = "Test User",
            Password = "StrongPass1!"
        };
        var result = _validator.Validate(request);
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("weak")]
    [InlineData("nouppercase1!")]
    [InlineData("NOLOWERCASE1!")]
    [InlineData("NoDigits!")]
    [InlineData("NoSpecial1")]
    public void Should_Fail_With_Weak_Password(string password)
    {
        var request = new RegisterRequest
        {
            Email = "test@test.com",
            Name = "Test",
            Password = password
        };
        var result = _validator.Validate(request);
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Should_Fail_When_Name_Is_Empty()
    {
        var request = new RegisterRequest
        {
            Email = "test@test.com",
            Name = "",
            Password = "StrongPass1!"
        };
        var result = _validator.Validate(request);
        result.IsValid.Should().BeFalse();
    }
}

public class ChangePasswordRequestValidatorTests
{
    private readonly ChangePasswordRequestValidator _validator = new();

    [Fact]
    public void Should_Fail_When_New_Password_Equals_Current()
    {
        var request = new ChangePasswordRequest
        {
            Id = "user-123",
            CurrentPassword = "SamePass1!",
            NewPassword = "SamePass1!"
        };
        var result = _validator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("differ"));
    }

    [Fact]
    public void Should_Pass_With_Valid_Different_Password()
    {
        var request = new ChangePasswordRequest
        {
            Id = "user-123",
            CurrentPassword = "OldPass1!",
            NewPassword = "NewPass2!"
        };
        var result = _validator.Validate(request);
        result.IsValid.Should().BeTrue();
    }
}

public class CreateInvoiceDtoValidatorTests
{
    private readonly CreateInvoiceDtoValidator _validator = new();

    [Fact]
    public void Should_Fail_When_Type_Is_Invalid()
    {
        var dto = new CreateInvoiceDto(
            Type: "Invalid",
            ClientName: null, ClientId: null, Rnc: null, DueDate: null,
            Currency: "USD", PaymentType: null, PaymentMethod: null,
            Items: default, Subtotal: 100, Discount: 0, DiscountType: null,
            DiscountAmount: 0, TaxableBase: 100, TaxRateId: null, Tax: 18,
            Total: 118, Status: "Draft", Notes: null, InstallmentPlan: null,
            CashRegisterId: null, AmountReceived: null, ChangeReturned: null);
        var result = _validator.Validate(dto);
        result.IsValid.Should().BeFalse();
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(-100)]
    public void Should_Fail_When_Total_Is_Negative(decimal total)
    {
        var dto = new CreateInvoiceDto(
            Type: "Factura", ClientName: null, ClientId: null, Rnc: null,
            DueDate: null, Currency: "USD", PaymentType: null, PaymentMethod: null,
            Items: default, Subtotal: 100, Discount: 0, DiscountType: null,
            DiscountAmount: 0, TaxableBase: 100, TaxRateId: null, Tax: 18,
            Total: total, Status: "Draft", Notes: null, InstallmentPlan: null,
            CashRegisterId: null, AmountReceived: null, ChangeReturned: null);
        var result = _validator.Validate(dto);
        result.IsValid.Should().BeFalse();
    }

    [Theory]
    [InlineData("US")]
    [InlineData("USDX")]
    public void Should_Fail_When_Currency_Is_Wrong_Length(string currency)
    {
        var dto = new CreateInvoiceDto(
            Type: "Factura", ClientName: null, ClientId: null, Rnc: null,
            DueDate: null, Currency: currency, PaymentType: null, PaymentMethod: null,
            Items: default, Subtotal: 100, Discount: 0, DiscountType: null,
            DiscountAmount: 0, TaxableBase: 100, TaxRateId: null, Tax: 18,
            Total: 118, Status: "Draft", Notes: null, InstallmentPlan: null,
            CashRegisterId: null, AmountReceived: null, ChangeReturned: null);
        var result = _validator.Validate(dto);
        result.IsValid.Should().BeFalse();
    }
}

public class CreateInventoryItemDtoValidatorTests
{
    private readonly CreateInventoryItemDtoValidator _validator = new();

    [Fact]
    public void Should_Fail_When_Name_Is_Empty()
    {
        var dto = new CreateInventoryItemDto(
            Name: "", Sku: "SKU-001", Shelf: null, Row: null, Box: null,
            Category: null, Stock: 10, MinStock: 5, Price: 25, Cost: 15,
            Location: null, Unit: null, Batch: null, ExpiryDate: null, Description: null);
        var result = _validator.Validate(dto);
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Should_Fail_When_Sku_Is_Empty()
    {
        var dto = new CreateInventoryItemDto(
            Name: "Product", Sku: "", Shelf: null, Row: null, Box: null,
            Category: null, Stock: 10, MinStock: 5, Price: 25, Cost: 15,
            Location: null, Unit: null, Batch: null, ExpiryDate: null, Description: null);
        var result = _validator.Validate(dto);
        result.IsValid.Should().BeFalse();
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(-100)]
    public void Should_Fail_When_Price_Is_Negative(decimal price)
    {
        var dto = new CreateInventoryItemDto(
            Name: "Product", Sku: "SKU-001", Shelf: null, Row: null, Box: null,
            Category: null, Stock: 10, MinStock: 5, Price: price, Cost: 15,
            Location: null, Unit: null, Batch: null, ExpiryDate: null, Description: null);
        var result = _validator.Validate(dto);
        result.IsValid.Should().BeFalse();
    }
}

public class CreatePurchaseOrderDtoValidatorTests
{
    private readonly CreatePurchaseOrderDtoValidator _validator = new();

    [Fact]
    public void Should_Fail_When_Supplier_Is_Empty()
    {
        var dto = new CreatePurchaseOrderDto(
            Supplier: "", Item: "Product", Qty: 10, Currency: "USD",
            Total: 100, Status: "Pending", Notes: null, CreatedBy: null, ReceivedAt: null);
        var result = _validator.Validate(dto);
        result.IsValid.Should().BeFalse();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    public void Should_Fail_When_Qty_Is_Zero_Or_Negative(decimal qty)
    {
        var dto = new CreatePurchaseOrderDto(
            Supplier: "Supplier", Item: "Product", Qty: qty, Currency: "USD",
            Total: 100, Status: "Pending", Notes: null, CreatedBy: null, ReceivedAt: null);
        var result = _validator.Validate(dto);
        result.IsValid.Should().BeFalse();
    }
}

public class CreatePayrollDtoValidatorTests
{
    private readonly CreatePayrollDtoValidator _validator = new();

    [Fact]
    public void Should_Fail_When_PeriodEnd_Is_Before_PeriodStart()
    {
        var dto = new CreatePayrollDto(
            EmployeeId: "emp-1",
            PeriodStart: new DateTime(2026, 1, 15),
            PeriodEnd: new DateTime(2026, 1, 1),
            GrossSalary: 50000, TotalDeductions: 5000,
            NetSalary: 45000, Bonuses: 0, OvertimePay: 0,
            Status: "Pending", PaidAt: null, PaymentMethod: null,
            ReceiptSent: false, Notes: null);
        var result = _validator.Validate(dto);
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Should_Pass_With_Valid_Payroll()
    {
        var dto = new CreatePayrollDto(
            EmployeeId: "emp-1",
            PeriodStart: new DateTime(2026, 1, 1),
            PeriodEnd: new DateTime(2026, 1, 31),
            GrossSalary: 50000, TotalDeductions: 5000,
            NetSalary: 45000, Bonuses: 0, OvertimePay: 0,
            Status: "Pending", PaidAt: null, PaymentMethod: null,
            ReceiptSent: false, Notes: null);
        var result = _validator.Validate(dto);
        result.IsValid.Should().BeTrue();
    }
}

public class CreateVacationDtoValidatorTests
{
    private readonly CreateVacationDtoValidator _validator = new();

    [Fact]
    public void Should_Fail_When_EndDate_Is_Before_StartDate()
    {
        var dto = new CreateVacationDto(
            EmployeeId: "emp-1", VacationType: "Annual",
            StartDate: new DateTime(2026, 8, 1),
            EndDate: new DateTime(2026, 7, 1),
            TotalDays: 10, Status: "Pending", ApprovedBy: null,
            Year: null, IsRecurring: false, Notes: null);
        var result = _validator.Validate(dto);
        result.IsValid.Should().BeFalse();
    }
}
