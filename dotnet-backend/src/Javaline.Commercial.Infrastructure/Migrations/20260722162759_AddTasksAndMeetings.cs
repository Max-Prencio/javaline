using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Javaline.Commercial.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTasksAndMeetings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AccountsPayable",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    SupplierName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Rnc = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Ncf = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DueDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Paid = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    PurchaseOrderId = table.Column<string>(type: "text", nullable: true),
                    TenantId = table.Column<string>(type: "text", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    PaymentsJson = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccountsPayable", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "AccountsReceivable",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    ClientName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Rnc = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Ncf = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DueDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Paid = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    InvoiceId = table.Column<string>(type: "text", nullable: true),
                    TenantId = table.Column<string>(type: "text", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    PaymentsJson = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccountsReceivable", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "activity_log",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenant_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    user_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    user_name = table.Column<string>(type: "text", nullable: true),
                    action = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    detail = table.Column<string>(type: "text", nullable: true),
                    store = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_activity_log", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "ai_conversations",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    user_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenant_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    title = table.Column<string>(type: "text", nullable: true),
                    messages = table.Column<string>(type: "text", nullable: false),
                    active = table.Column<bool>(type: "boolean", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_conversations", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "approval_hierarchies",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    currency = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    role = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    min_amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    max_amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_approval_hierarchies", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "ats_candidates",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenant_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    email = table.Column<string>(type: "text", nullable: true),
                    phone = table.Column<string>(type: "text", nullable: true),
                    position_applied = table.Column<string>(type: "text", nullable: true),
                    resume_file = table.Column<string>(type: "text", nullable: true),
                    resume_text = table.Column<string>(type: "text", nullable: true),
                    position_descr_file = table.Column<string>(type: "text", nullable: true),
                    ai_analysis = table.Column<string>(type: "text", nullable: true),
                    classification = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    score = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    strengths = table.Column<string>(type: "text", nullable: true),
                    weaknesses = table.Column<string>(type: "text", nullable: true),
                    recommendations = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    evaluated_by = table.Column<string>(type: "text", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ats_candidates", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "audit_logs",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    user_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    action = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    entity_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    entity_id = table.Column<string>(type: "text", nullable: true),
                    details = table.Column<string>(type: "text", nullable: true),
                    ip_address = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_audit_logs", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "branches",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    address = table.Column<string>(type: "text", nullable: true),
                    phone = table.Column<string>(type: "text", nullable: true),
                    email = table.Column<string>(type: "text", nullable: true),
                    manager = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_branches", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "business_context",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenant_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    title = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    content = table.Column<string>(type: "text", nullable: false),
                    category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_business_context", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "cash_registers",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    user_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    open_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    close_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    initial_balance = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    current_balance = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    total_income = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    total_expense = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    currency = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    transactions = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cash_registers", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "CashReconciliations",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CashRegisterId = table.Column<string>(type: "text", nullable: true),
                    OpeningBalance = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    TotalIncome = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    TotalExpenses = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    TheoreticalBalance = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    ActualCash = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Difference = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    TenantId = table.Column<string>(type: "text", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CashReconciliations", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "ChartAccounts",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    Code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ParentCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Level = table.Column<int>(type: "integer", nullable: false),
                    Active = table.Column<bool>(type: "boolean", nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    TenantId = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChartAccounts", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "CheckRecords",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    Number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Bank = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Payee = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Currency = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Concept = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    TenantId = table.Column<string>(type: "text", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CheckRecords", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "contacts",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    company = table.Column<string>(type: "text", nullable: true),
                    rnc = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    email = table.Column<string>(type: "text", nullable: true),
                    phone = table.Column<string>(type: "text", nullable: true),
                    type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    address = table.Column<string>(type: "text", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contacts", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "CostRecords",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Concept = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Itbis = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    SupplierNcf = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    AccountCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    TenantId = table.Column<string>(type: "text", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CostRecords", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "CreditNotes",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    Ncf = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    NcfType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    PartyType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    PartyName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PartyRnc = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    OriginalNcf = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Concept = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Itbis = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    TenantId = table.Column<string>(type: "text", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CreditNotes", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "DebitNotes",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    Ncf = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    NcfType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    PartyType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    PartyName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PartyRnc = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    OriginalNcf = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Concept = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Itbis = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    TenantId = table.Column<string>(type: "text", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DebitNotes", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "discount_config",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    type = table.Column<string>(type: "text", nullable: false),
                    value = table.Column<double>(type: "double precision", nullable: false),
                    active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_discount_config", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "exemption_config",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    applies_to = table.Column<string>(type: "text", nullable: true),
                    active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_exemption_config", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "FixedAssets",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AcquisitionDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AcquisitionCost = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    UsefulLifeYears = table.Column<int>(type: "integer", nullable: false),
                    DepreciationMethod = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    SalvageValue = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Location = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    SerialNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    DisposalDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DisposalPrice = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    DisposalReason = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    TenantId = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FixedAssets", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "hr_positions",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenant_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    description_file = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_hr_positions", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "IncomeRecords",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Concept = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Itbis = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Ncf = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    AccountCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    TenantId = table.Column<string>(type: "text", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IncomeRecords", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "inventory",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenant_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    sku = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    shelf = table.Column<string>(type: "text", nullable: true),
                    row = table.Column<string>(type: "text", nullable: true),
                    box = table.Column<string>(type: "text", nullable: true),
                    category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    stock = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    min_stock = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    price = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    cost = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    location = table.Column<string>(type: "text", nullable: true),
                    unit = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    batch = table.Column<string>(type: "text", nullable: true),
                    expiry_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    description = table.Column<string>(type: "text", nullable: true),
                    active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inventory", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "inventory_counts",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenant_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    user_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    user_name = table.Column<string>(type: "text", nullable: false),
                    product_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    product_name = table.Column<string>(type: "text", nullable: false),
                    sku = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    warehouse = table.Column<string>(type: "text", nullable: true),
                    shelf = table.Column<string>(type: "text", nullable: true),
                    row = table.Column<string>(type: "text", nullable: true),
                    box = table.Column<string>(type: "text", nullable: true),
                    scanned_count = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    session_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inventory_counts", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "invoices",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    client_name = table.Column<string>(type: "text", nullable: true),
                    client_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    rnc = table.Column<string>(type: "text", nullable: true),
                    date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    due_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    currency = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    payment_type = table.Column<string>(type: "text", nullable: true),
                    payment_method = table.Column<string>(type: "text", nullable: true),
                    items = table.Column<string>(type: "text", nullable: false),
                    subtotal = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    discount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    discount_type = table.Column<string>(type: "text", nullable: true),
                    discount_amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    taxable_base = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    tax_rate_id = table.Column<string>(type: "text", nullable: true),
                    tax = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    total = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    installment_plan = table.Column<string>(type: "text", nullable: true),
                    cash_register_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    amount_received = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    change_returned = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    rectifies_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    created_by = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    paid_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_invoices", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "JournalEntries",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Reference = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    TotalDebit = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    TotalCredit = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    ReversesId = table.Column<string>(type: "text", nullable: true),
                    TenantId = table.Column<string>(type: "text", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    LinesJson = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JournalEntries", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "NcfSequences",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    NcfType = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CurrentSequence = table.Column<long>(type: "bigint", nullable: false),
                    MaxSequence = table.Column<long>(type: "bigint", nullable: false),
                    Active = table.Column<bool>(type: "boolean", nullable: false),
                    TenantId = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NcfSequences", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "PettyCashFunds",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    InitialBalance = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    CurrentBalance = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Currency = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Active = table.Column<bool>(type: "boolean", nullable: false),
                    TenantId = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PettyCashFunds", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "PettyCashMovements",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    FundId = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Concept = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    BalanceAfter = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Receipt = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TenantId = table.Column<string>(type: "text", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PettyCashMovements", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "pocket_notifications",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenant_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    user_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    message = table.Column<string>(type: "text", nullable: false),
                    type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    read = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pocket_notifications", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "RefreshTokens",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    UserId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    Token = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RevokedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RevokedByIp = table.Column<string>(type: "text", nullable: true),
                    ReplacedByToken = table.Column<string>(type: "text", nullable: true),
                    CreatedByIp = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefreshTokens", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "surveys",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenant_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    questions = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    created_by = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_surveys", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "tax_config",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    rate = table.Column<double>(type: "double precision", nullable: false),
                    type = table.Column<string>(type: "text", nullable: false),
                    active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tax_config", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "tenant_settings",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenant_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    key = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    value = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tenant_settings", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenant_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    password_hash = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    role = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    phone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    position = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    bio = table.Column<string>(type: "text", nullable: true),
                    notification_email = table.Column<string>(type: "text", nullable: true),
                    alt_email = table.Column<string>(type: "text", nullable: true),
                    photo = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    two_factor_enabled = table.Column<bool>(type: "boolean", nullable: false),
                    two_factor_secret = table.Column<string>(type: "text", nullable: true),
                    invitation_token = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "sales",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    product_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    quantity = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    unit_price = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    total = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    customer = table.Column<string>(type: "text", nullable: true),
                    user_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sales", x => x.id);
                    table.ForeignKey(
                        name: "FK_sales_inventory_product_id",
                        column: x => x.product_id,
                        principalTable: "inventory",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "survey_responses",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenant_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    survey_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    employee_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    answers = table.Column<string>(type: "text", nullable: false),
                    submitted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_survey_responses", x => x.id);
                    table.ForeignKey(
                        name: "FK_survey_responses_surveys_survey_id",
                        column: x => x.survey_id,
                        principalTable: "surveys",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "employees",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenant_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    user_id = table.Column<string>(type: "character varying(36)", nullable: true),
                    name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    phone = table.Column<string>(type: "text", nullable: true),
                    department = table.Column<string>(type: "text", nullable: true),
                    position = table.Column<string>(type: "text", nullable: true),
                    salary = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    salary_type = table.Column<string>(type: "text", nullable: true),
                    hire_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    contract_end_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    contract_type = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    photo = table.Column<string>(type: "text", nullable: true),
                    supervisor_id = table.Column<string>(type: "character varying(36)", nullable: true),
                    rnc = table.Column<string>(type: "text", nullable: true),
                    tss_number = table.Column<string>(type: "text", nullable: true),
                    ars = table.Column<string>(type: "text", nullable: true),
                    afp = table.Column<string>(type: "text", nullable: true),
                    bank_account = table.Column<string>(type: "text", nullable: true),
                    emergency_contact = table.Column<string>(type: "text", nullable: true),
                    emergency_phone = table.Column<string>(type: "text", nullable: true),
                    punch_enabled = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_employees", x => x.id);
                    table.ForeignKey(
                        name: "FK_employees_employees_supervisor_id",
                        column: x => x.supervisor_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_employees_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "meetings",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    title = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    start_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    end_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    location = table.Column<string>(type: "text", nullable: true),
                    attendees = table.Column<string>(type: "text", nullable: true),
                    type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    user_id = table.Column<string>(type: "character varying(36)", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_meetings", x => x.id);
                    table.ForeignKey(
                        name: "FK_meetings_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "notifications",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    user_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    title = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    message = table.Column<string>(type: "text", nullable: false),
                    read = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notifications", x => x.id);
                    table.ForeignKey(
                        name: "FK_notifications_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "permissions",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    user_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    module = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    can_view = table.Column<bool>(type: "boolean", nullable: false),
                    can_create = table.Column<bool>(type: "boolean", nullable: false),
                    can_edit = table.Column<bool>(type: "boolean", nullable: false),
                    can_delete = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_permissions", x => x.id);
                    table.ForeignKey(
                        name: "FK_permissions_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "purchase_orders",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    supplier = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    item = table.Column<string>(type: "text", nullable: false),
                    qty = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    currency = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    total = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_by = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    received_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_purchase_orders", x => x.id);
                    table.ForeignKey(
                        name: "FK_purchase_orders_users_created_by",
                        column: x => x.created_by,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "stock_movements",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    product_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    quantity = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    reason = table.Column<string>(type: "text", nullable: true),
                    before_stock = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    after_stock = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    user_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stock_movements", x => x.id);
                    table.ForeignKey(
                        name: "FK_stock_movements_inventory_product_id",
                        column: x => x.product_id,
                        principalTable: "inventory",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_stock_movements_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "tasks",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    title = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    priority = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    assigned_to = table.Column<string>(type: "text", nullable: true),
                    due_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    user_id = table.Column<string>(type: "character varying(36)", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tasks", x => x.id);
                    table.ForeignKey(
                        name: "FK_tasks_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "attendances",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenant_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    employee_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    clock_in = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    clock_out = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    break_start = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    break_end = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    total_hours = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    overtime_hours = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    missing_hours = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    source = table.Column<string>(type: "text", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_attendances", x => x.id);
                    table.ForeignKey(
                        name: "FK_attendances_employees_employee_id",
                        column: x => x.employee_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "deductions",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenant_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    employee_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    deduction_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    percentage = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    is_mandatory = table.Column<bool>(type: "boolean", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_deductions", x => x.id);
                    table.ForeignKey(
                        name: "FK_deductions_employees_employee_id",
                        column: x => x.employee_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "payrolls",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenant_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    employee_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    period_start = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    period_end = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    gross_salary = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    total_deductions = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    net_salary = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    bonuses = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    overtime_pay = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    paid_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    payment_method = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    receipt_sent = table.Column<bool>(type: "boolean", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_payrolls", x => x.id);
                    table.ForeignKey(
                        name: "FK_payrolls_employees_employee_id",
                        column: x => x.employee_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "performance_evaluations",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenant_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    employee_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    evaluator_id = table.Column<string>(type: "text", nullable: true),
                    evaluation_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    score = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    max_score = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    strengths = table.Column<string>(type: "text", nullable: true),
                    weaknesses = table.Column<string>(type: "text", nullable: true),
                    recommendations = table.Column<string>(type: "text", nullable: true),
                    criteria_scores = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_performance_evaluations", x => x.id);
                    table.ForeignKey(
                        name: "FK_performance_evaluations_employees_employee_id",
                        column: x => x.employee_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "vacations",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenant_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    employee_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    vacation_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    start_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    end_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    total_days = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    approved_by = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    year = table.Column<int>(type: "integer", nullable: true),
                    is_recurring = table.Column<bool>(type: "boolean", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vacations", x => x.id);
                    table.ForeignKey(
                        name: "FK_vacations_employees_employee_id",
                        column: x => x.employee_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "approvals",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    purchase_order_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    approved_by = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    amount_approved = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    comment = table.Column<string>(type: "text", nullable: true),
                    approved_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_approvals", x => x.id);
                    table.ForeignKey(
                        name: "FK_approvals_purchase_orders_purchase_order_id",
                        column: x => x.purchase_order_id,
                        principalTable: "purchase_orders",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_approvals_users_approved_by",
                        column: x => x.approved_by,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "purchase_order_items",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    order_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    product_name = table.Column<string>(type: "text", nullable: false),
                    sku = table.Column<string>(type: "text", nullable: true),
                    quantity = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    unit_price = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    total = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_purchase_order_items", x => x.id);
                    table.ForeignKey(
                        name: "FK_purchase_order_items_purchase_orders_order_id",
                        column: x => x.order_id,
                        principalTable: "purchase_orders",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AccountsPayable_TenantId_Status",
                table: "AccountsPayable",
                columns: new[] { "TenantId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_AccountsReceivable_TenantId_Status",
                table: "AccountsReceivable",
                columns: new[] { "TenantId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_activity_log_tenant_id_action",
                table: "activity_log",
                columns: new[] { "tenant_id", "action" });

            migrationBuilder.CreateIndex(
                name: "IX_activity_log_user_id",
                table: "activity_log",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_approvals_approved_by",
                table: "approvals",
                column: "approved_by");

            migrationBuilder.CreateIndex(
                name: "IX_approvals_purchase_order_id",
                table: "approvals",
                column: "purchase_order_id");

            migrationBuilder.CreateIndex(
                name: "IX_attendances_employee_id",
                table: "attendances",
                column: "employee_id");

            migrationBuilder.CreateIndex(
                name: "IX_attendances_tenant_id_date",
                table: "attendances",
                columns: new[] { "tenant_id", "date" });

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_entity_type_user_id",
                table: "audit_logs",
                columns: new[] { "entity_type", "user_id" });

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_user_id",
                table: "audit_logs",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_ChartAccounts_TenantId_Code",
                table: "ChartAccounts",
                columns: new[] { "TenantId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_contacts_name",
                table: "contacts",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "IX_contacts_type",
                table: "contacts",
                column: "type");

            migrationBuilder.CreateIndex(
                name: "IX_CostRecords_TenantId_Date",
                table: "CostRecords",
                columns: new[] { "TenantId", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_deductions_employee_id",
                table: "deductions",
                column: "employee_id");

            migrationBuilder.CreateIndex(
                name: "IX_deductions_tenant_id_employee_id",
                table: "deductions",
                columns: new[] { "tenant_id", "employee_id" });

            migrationBuilder.CreateIndex(
                name: "IX_employees_status",
                table: "employees",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_employees_supervisor_id",
                table: "employees",
                column: "supervisor_id");

            migrationBuilder.CreateIndex(
                name: "IX_employees_tenant_id",
                table: "employees",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_employees_user_id",
                table: "employees",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_IncomeRecords_TenantId_Date",
                table: "IncomeRecords",
                columns: new[] { "TenantId", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_inventory_active",
                table: "inventory",
                column: "active");

            migrationBuilder.CreateIndex(
                name: "IX_inventory_sku",
                table: "inventory",
                column: "sku",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inventory_tenant_id",
                table: "inventory",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_invoices_client_id",
                table: "invoices",
                column: "client_id");

            migrationBuilder.CreateIndex(
                name: "IX_invoices_date",
                table: "invoices",
                column: "date");

            migrationBuilder.CreateIndex(
                name: "IX_invoices_status",
                table: "invoices",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_invoices_status_date",
                table: "invoices",
                columns: new[] { "status", "date" });

            migrationBuilder.CreateIndex(
                name: "IX_JournalEntries_TenantId_Date",
                table: "JournalEntries",
                columns: new[] { "TenantId", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_meetings_start_date",
                table: "meetings",
                column: "start_date");

            migrationBuilder.CreateIndex(
                name: "IX_meetings_user_id",
                table: "meetings",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_NcfSequences_TenantId_NcfType",
                table: "NcfSequences",
                columns: new[] { "TenantId", "NcfType" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_notifications_user_id",
                table: "notifications",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_payrolls_employee_id",
                table: "payrolls",
                column: "employee_id");

            migrationBuilder.CreateIndex(
                name: "IX_payrolls_tenant_id_employee_id",
                table: "payrolls",
                columns: new[] { "tenant_id", "employee_id" });

            migrationBuilder.CreateIndex(
                name: "IX_payrolls_tenant_id_status",
                table: "payrolls",
                columns: new[] { "tenant_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_performance_evaluations_employee_id",
                table: "performance_evaluations",
                column: "employee_id");

            migrationBuilder.CreateIndex(
                name: "IX_permissions_user_id_module",
                table: "permissions",
                columns: new[] { "user_id", "module" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_purchase_order_items_order_id",
                table: "purchase_order_items",
                column: "order_id");

            migrationBuilder.CreateIndex(
                name: "IX_purchase_orders_created_by",
                table: "purchase_orders",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "IX_purchase_orders_status",
                table: "purchase_orders",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_Token",
                table: "RefreshTokens",
                column: "Token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_UserId",
                table: "RefreshTokens",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_sales_product_id",
                table: "sales",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_stock_movements_product_id",
                table: "stock_movements",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_stock_movements_type",
                table: "stock_movements",
                column: "type");

            migrationBuilder.CreateIndex(
                name: "IX_stock_movements_user_id",
                table: "stock_movements",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_survey_responses_survey_id",
                table: "survey_responses",
                column: "survey_id");

            migrationBuilder.CreateIndex(
                name: "IX_tasks_status",
                table: "tasks",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_tasks_user_id",
                table: "tasks",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_users_email",
                table: "users",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_vacations_employee_id",
                table: "vacations",
                column: "employee_id");

            migrationBuilder.CreateIndex(
                name: "IX_vacations_tenant_id_status",
                table: "vacations",
                columns: new[] { "tenant_id", "status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AccountsPayable");

            migrationBuilder.DropTable(
                name: "AccountsReceivable");

            migrationBuilder.DropTable(
                name: "activity_log");

            migrationBuilder.DropTable(
                name: "ai_conversations");

            migrationBuilder.DropTable(
                name: "approval_hierarchies");

            migrationBuilder.DropTable(
                name: "approvals");

            migrationBuilder.DropTable(
                name: "ats_candidates");

            migrationBuilder.DropTable(
                name: "attendances");

            migrationBuilder.DropTable(
                name: "audit_logs");

            migrationBuilder.DropTable(
                name: "branches");

            migrationBuilder.DropTable(
                name: "business_context");

            migrationBuilder.DropTable(
                name: "cash_registers");

            migrationBuilder.DropTable(
                name: "CashReconciliations");

            migrationBuilder.DropTable(
                name: "ChartAccounts");

            migrationBuilder.DropTable(
                name: "CheckRecords");

            migrationBuilder.DropTable(
                name: "contacts");

            migrationBuilder.DropTable(
                name: "CostRecords");

            migrationBuilder.DropTable(
                name: "CreditNotes");

            migrationBuilder.DropTable(
                name: "DebitNotes");

            migrationBuilder.DropTable(
                name: "deductions");

            migrationBuilder.DropTable(
                name: "discount_config");

            migrationBuilder.DropTable(
                name: "exemption_config");

            migrationBuilder.DropTable(
                name: "FixedAssets");

            migrationBuilder.DropTable(
                name: "hr_positions");

            migrationBuilder.DropTable(
                name: "IncomeRecords");

            migrationBuilder.DropTable(
                name: "inventory_counts");

            migrationBuilder.DropTable(
                name: "invoices");

            migrationBuilder.DropTable(
                name: "JournalEntries");

            migrationBuilder.DropTable(
                name: "meetings");

            migrationBuilder.DropTable(
                name: "NcfSequences");

            migrationBuilder.DropTable(
                name: "notifications");

            migrationBuilder.DropTable(
                name: "payrolls");

            migrationBuilder.DropTable(
                name: "performance_evaluations");

            migrationBuilder.DropTable(
                name: "permissions");

            migrationBuilder.DropTable(
                name: "PettyCashFunds");

            migrationBuilder.DropTable(
                name: "PettyCashMovements");

            migrationBuilder.DropTable(
                name: "pocket_notifications");

            migrationBuilder.DropTable(
                name: "purchase_order_items");

            migrationBuilder.DropTable(
                name: "RefreshTokens");

            migrationBuilder.DropTable(
                name: "sales");

            migrationBuilder.DropTable(
                name: "stock_movements");

            migrationBuilder.DropTable(
                name: "survey_responses");

            migrationBuilder.DropTable(
                name: "tasks");

            migrationBuilder.DropTable(
                name: "tax_config");

            migrationBuilder.DropTable(
                name: "tenant_settings");

            migrationBuilder.DropTable(
                name: "vacations");

            migrationBuilder.DropTable(
                name: "purchase_orders");

            migrationBuilder.DropTable(
                name: "inventory");

            migrationBuilder.DropTable(
                name: "surveys");

            migrationBuilder.DropTable(
                name: "employees");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
