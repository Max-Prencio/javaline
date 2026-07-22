using Javaline.Commercial.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Javaline.Commercial.Infrastructure.Data;

public class JavalineDbContext : DbContext
{
    public JavalineDbContext(DbContextOptions<JavalineDbContext> options) : base(options) { }

    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();
    public DbSet<AiConversation> AiConversations => Set<AiConversation>();
    public DbSet<Approval> Approvals => Set<Approval>();
    public DbSet<ApprovalHierarchy> ApprovalHierarchies => Set<ApprovalHierarchy>();
    public DbSet<ATSCandidate> ATSCandidates => Set<ATSCandidate>();
    public DbSet<Attendance> Attendances => Set<Attendance>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<BusinessContext> BusinessContexts => Set<BusinessContext>();
    public DbSet<CashRegister> CashRegisters => Set<CashRegister>();
    public DbSet<Contact> Contacts => Set<Contact>();
    public DbSet<Deduction> Deductions => Set<Deduction>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<HRPosition> HRPositions => Set<HRPosition>();
    public DbSet<InventoryCount> InventoryCounts => Set<InventoryCount>();
    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<Payroll> Payrolls => Set<Payroll>();
    public DbSet<PerformanceEvaluation> PerformanceEvaluations => Set<PerformanceEvaluation>();
    public DbSet<PocketNotification> PocketNotifications => Set<PocketNotification>();
    public DbSet<PurchaseOrder> PurchaseOrders => Set<PurchaseOrder>();
    public DbSet<Sale> Sales => Set<Sale>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();
    public DbSet<Survey> Surveys => Set<Survey>();
    public DbSet<SurveyResponse> SurveyResponses => Set<SurveyResponse>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Vacation> Vacations => Set<Vacation>();
    public DbSet<PurchaseOrderItem> PurchaseOrderItems => Set<PurchaseOrderItem>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<TenantSettings> TenantSettings => Set<TenantSettings>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<DiscountConfig> DiscountConfigs => Set<DiscountConfig>();
    public DbSet<TaxConfig> TaxConfigs => Set<TaxConfig>();
    public DbSet<ExemptionConfig> ExemptionConfigs => Set<ExemptionConfig>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    // Accounting
    public DbSet<ChartAccount> ChartAccounts => Set<ChartAccount>();
    public DbSet<JournalEntry> JournalEntries => Set<JournalEntry>();
    public DbSet<AccountsReceivable> AccountsReceivable => Set<AccountsReceivable>();
    public DbSet<AccountsPayable> AccountsPayable => Set<AccountsPayable>();
    public DbSet<DebitNote> DebitNotes => Set<DebitNote>();
    public DbSet<CreditNote> CreditNotes => Set<CreditNote>();
    public DbSet<CheckRecord> CheckRecords => Set<CheckRecord>();
    public DbSet<PettyCashFund> PettyCashFunds => Set<PettyCashFund>();
    public DbSet<PettyCashMovement> PettyCashMovements => Set<PettyCashMovement>();
    public DbSet<FixedAsset> FixedAssets => Set<FixedAsset>();
    public DbSet<NcfSequence> NcfSequences => Set<NcfSequence>();
    public DbSet<IncomeRecord> IncomeRecords => Set<IncomeRecord>();
    public DbSet<CostRecord> CostRecords => Set<CostRecord>();
    public DbSet<CashReconciliation> CashReconciliations => Set<CashReconciliation>();

    // Collaboration
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<Meeting> Meetings => Set<Meeting>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(decimal) || property.ClrType == typeof(decimal?))
                {
                    property.SetColumnType("numeric(18,2)");
                }
            }
        }

        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Id).HasMaxLength(36);
            e.Property(u => u.TenantId).HasMaxLength(36);
            e.Property(u => u.Name).HasMaxLength(256);
            e.Property(u => u.Email).HasMaxLength(256);
            e.Property(u => u.PasswordHash).HasMaxLength(512);
            e.Property(u => u.Role).HasMaxLength(50);
            e.Property(u => u.Phone).HasMaxLength(50);
            e.Property(u => u.Position).HasMaxLength(100);
            e.Property(u => u.Status).HasMaxLength(50);
            e.Property(u => u.InvitationToken).HasMaxLength(512);
        });

        modelBuilder.Entity<InventoryItem>(e =>
        {
            e.HasIndex(i => i.Sku).IsUnique();
            e.Property(i => i.Id).HasMaxLength(36);
            e.Property(i => i.TenantId).HasMaxLength(36);
            e.Property(i => i.Name).HasMaxLength(256);
            e.Property(i => i.Sku).HasMaxLength(100);
            e.Property(i => i.Category).HasMaxLength(100);
            e.Property(i => i.Unit).HasMaxLength(50);
        });

        modelBuilder.Entity<Employee>(e =>
        {
            e.Property(e => e.Id).HasMaxLength(36);
            e.Property(e => e.TenantId).HasMaxLength(36);
            e.Property(e => e.Name).HasMaxLength(256);
            e.Property(e => e.Email).HasMaxLength(256);
            e.Property(e => e.Status).HasMaxLength(50);

            e.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            e.HasOne(e => e.Supervisor)
                .WithMany(s => s.Subordinates)
                .HasForeignKey(e => e.SupervisorId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Approval>(e =>
        {
            e.Property(a => a.Id).HasMaxLength(36);
            e.Property(a => a.PurchaseOrderId).HasMaxLength(36);
            e.Property(a => a.ApprovedBy).HasMaxLength(36);
            e.Property(a => a.Status).HasMaxLength(50);

            e.HasOne(a => a.PurchaseOrder)
                .WithMany(po => po.Approvals)
                .HasForeignKey(a => a.PurchaseOrderId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(a => a.Approver)
                .WithMany()
                .HasForeignKey(a => a.ApprovedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ApprovalHierarchy>(e =>
        {
            e.Property(a => a.Id).HasMaxLength(36);
            e.Property(a => a.Currency).HasMaxLength(10);
            e.Property(a => a.Role).HasMaxLength(100);
        });

        modelBuilder.Entity<ATSCandidate>(e =>
        {
            e.Property(a => a.Id).HasMaxLength(36);
            e.Property(a => a.TenantId).HasMaxLength(36);
            e.Property(a => a.Name).HasMaxLength(256);
            e.Property(a => a.Classification).HasMaxLength(100);
            e.Property(a => a.Status).HasMaxLength(50);
        });

        modelBuilder.Entity<Attendance>(e =>
        {
            e.Property(a => a.Id).HasMaxLength(36);
            e.Property(a => a.TenantId).HasMaxLength(36);
            e.Property(a => a.EmployeeId).HasMaxLength(36);
            e.Property(a => a.Status).HasMaxLength(50);

            e.HasOne(a => a.Employee)
                .WithMany(emp => emp.Attendances)
                .HasForeignKey(a => a.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Branch>(e =>
        {
            e.Property(b => b.Id).HasMaxLength(36);
            e.Property(b => b.Name).HasMaxLength(256);
            e.Property(b => b.Manager).HasMaxLength(256);
        });

        modelBuilder.Entity<BusinessContext>(e =>
        {
            e.Property(b => b.Id).HasMaxLength(36);
            e.Property(b => b.TenantId).HasMaxLength(36);
            e.Property(b => b.Title).HasMaxLength(256);
            e.Property(b => b.Category).HasMaxLength(100);
        });

        modelBuilder.Entity<CashRegister>(e =>
        {
            e.Property(c => c.Id).HasMaxLength(36);
            e.Property(c => c.UserId).HasMaxLength(36);
            e.Property(c => c.Status).HasMaxLength(50);
            e.Property(c => c.Currency).HasMaxLength(10);
        });

        modelBuilder.Entity<Contact>(e =>
        {
            e.Property(c => c.Id).HasMaxLength(36);
            e.Property(c => c.Name).HasMaxLength(256);
            e.Property(c => c.Rnc).HasMaxLength(20);
            e.Property(c => c.Type).HasMaxLength(50);
        });

        modelBuilder.Entity<Deduction>(e =>
        {
            e.Property(d => d.Id).HasMaxLength(36);
            e.Property(d => d.TenantId).HasMaxLength(36);
            e.Property(d => d.EmployeeId).HasMaxLength(36);
            e.Property(d => d.Name).HasMaxLength(256);
            e.Property(d => d.DeductionType).HasMaxLength(100);

            e.HasOne(d => d.Employee)
                .WithMany(emp => emp.Deductions)
                .HasForeignKey(d => d.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<HRPosition>(e =>
        {
            e.Property(h => h.Id).HasMaxLength(36);
            e.Property(h => h.TenantId).HasMaxLength(36);
            e.Property(h => h.Name).HasMaxLength(256);
        });

        modelBuilder.Entity<InventoryCount>(e =>
        {
            e.Property(i => i.Id).HasMaxLength(36);
            e.Property(i => i.TenantId).HasMaxLength(36);
            e.Property(i => i.UserId).HasMaxLength(36);
            e.Property(i => i.ProductId).HasMaxLength(36);
            e.Property(i => i.Sku).HasMaxLength(100);
            e.Property(i => i.Status).HasMaxLength(50);
            e.Property(i => i.SessionId).HasMaxLength(36);
        });

        modelBuilder.Entity<Invoice>(e =>
        {
            e.Property(i => i.Id).HasMaxLength(36);
            e.Property(i => i.Type).HasMaxLength(50);
            e.Property(i => i.ClientId).HasMaxLength(36);
            e.Property(i => i.Currency).HasMaxLength(10);
            e.Property(i => i.Status).HasMaxLength(50);
            e.Property(i => i.CashRegisterId).HasMaxLength(36);
            e.Property(i => i.RectifiesId).HasMaxLength(36);
            e.Property(i => i.CreatedBy).HasMaxLength(36);
        });

        modelBuilder.Entity<Payroll>(e =>
        {
            e.Property(p => p.Id).HasMaxLength(36);
            e.Property(p => p.TenantId).HasMaxLength(36);
            e.Property(p => p.EmployeeId).HasMaxLength(36);
            e.Property(p => p.Status).HasMaxLength(50);
            e.Property(p => p.PaymentMethod).HasMaxLength(50);

            e.HasOne(p => p.Employee)
                .WithMany(emp => emp.Payrolls)
                .HasForeignKey(p => p.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PerformanceEvaluation>(e =>
        {
            e.Property(p => p.Id).HasMaxLength(36);
            e.Property(p => p.TenantId).HasMaxLength(36);
            e.Property(p => p.EmployeeId).HasMaxLength(36);
            e.Property(p => p.Category).HasMaxLength(100);
            e.Property(p => p.Status).HasMaxLength(50);

            e.HasOne(p => p.Employee)
                .WithMany(emp => emp.Evaluations)
                .HasForeignKey(p => p.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PocketNotification>(e =>
        {
            e.Property(p => p.Id).HasMaxLength(36);
            e.Property(p => p.TenantId).HasMaxLength(36);
            e.Property(p => p.UserId).HasMaxLength(36);
            e.Property(p => p.Type).HasMaxLength(50);
        });

        modelBuilder.Entity<PurchaseOrder>(e =>
        {
            e.Property(p => p.Id).HasMaxLength(36);
            e.Property(p => p.Supplier).HasMaxLength(256);
            e.Property(p => p.Currency).HasMaxLength(10);
            e.Property(p => p.Status).HasMaxLength(50);
            e.Property(p => p.CreatedBy).HasMaxLength(36);

            e.HasOne(p => p.Creator)
                .WithMany()
                .HasForeignKey(p => p.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Sale>(e =>
        {
            e.Property(s => s.Id).HasMaxLength(36);
            e.Property(s => s.ProductId).HasMaxLength(36);
            e.Property(s => s.UserId).HasMaxLength(36);

            e.HasOne(s => s.Product)
                .WithMany(i => i.Sales)
                .HasForeignKey(s => s.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<StockMovement>(e =>
        {
            e.Property(s => s.Id).HasMaxLength(36);
            e.Property(s => s.ProductId).HasMaxLength(36);
            e.Property(s => s.Type).HasMaxLength(50);
            e.Property(s => s.UserId).HasMaxLength(36);

            e.HasOne(s => s.Product)
                .WithMany(i => i.StockMovements)
                .HasForeignKey(s => s.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(s => s.User)
                .WithMany()
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Survey>(e =>
        {
            e.Property(s => s.Id).HasMaxLength(36);
            e.Property(s => s.TenantId).HasMaxLength(36);
            e.Property(s => s.Status).HasMaxLength(50);
            e.Property(s => s.CreatedBy).HasMaxLength(36);
        });

        modelBuilder.Entity<SurveyResponse>(e =>
        {
            e.Property(sr => sr.Id).HasMaxLength(36);
            e.Property(sr => sr.TenantId).HasMaxLength(36);
            e.Property(sr => sr.SurveyId).HasMaxLength(36);
            e.Property(sr => sr.EmployeeId).HasMaxLength(36);

            e.HasOne(sr => sr.Survey)
                .WithMany()
                .HasForeignKey(sr => sr.SurveyId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Vacation>(e =>
        {
            e.Property(v => v.Id).HasMaxLength(36);
            e.Property(v => v.TenantId).HasMaxLength(36);
            e.Property(v => v.EmployeeId).HasMaxLength(36);
            e.Property(v => v.VacationType).HasMaxLength(100);
            e.Property(v => v.Status).HasMaxLength(50);
            e.Property(v => v.ApprovedBy).HasMaxLength(36);

            e.HasOne(v => v.Employee)
                .WithMany(emp => emp.Vacations)
                .HasForeignKey(v => v.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ActivityLog>(e =>
        {
            e.Property(a => a.Id).HasMaxLength(36);
            e.Property(a => a.TenantId).HasMaxLength(36);
            e.Property(a => a.UserId).HasMaxLength(36);
            e.Property(a => a.Action).HasMaxLength(256);
        });

        modelBuilder.Entity<AiConversation>(e =>
        {
            e.Property(a => a.Id).HasMaxLength(36);
            e.Property(a => a.UserId).HasMaxLength(36);
            e.Property(a => a.TenantId).HasMaxLength(36);
        });

        modelBuilder.Entity<PurchaseOrderItem>(e =>
        {
            e.Property(p => p.Id).HasMaxLength(36);
            e.Property(p => p.OrderId).HasMaxLength(36);

            e.HasOne(p => p.PurchaseOrder)
                .WithMany()
                .HasForeignKey(p => p.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Permission>(e =>
        {
            e.Property(p => p.Id).HasMaxLength(36);
            e.Property(p => p.UserId).HasMaxLength(36);
            e.Property(p => p.Module).HasMaxLength(100);

            e.HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AuditLog>(e =>
        {
            e.Property(a => a.Id).HasMaxLength(36);
            e.Property(a => a.UserId).HasMaxLength(36);
            e.Property(a => a.Action).HasMaxLength(256);
            e.Property(a => a.EntityType).HasMaxLength(100);
        });

        modelBuilder.Entity<TenantSettings>(e =>
        {
            e.Property(t => t.Id).HasMaxLength(36);
            e.Property(t => t.TenantId).HasMaxLength(36);
            e.Property(t => t.Key).HasMaxLength(256);
        });

        modelBuilder.Entity<Notification>(e =>
        {
            e.Property(n => n.Id).HasMaxLength(36);
            e.Property(n => n.UserId).HasMaxLength(36);
            e.Property(n => n.Title).HasMaxLength(256);

            e.HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Invoice>(e =>
        {
            e.HasIndex(i => i.Date);
            e.HasIndex(i => i.Status);
            e.HasIndex(i => new { i.Status, i.Date });
            e.HasIndex(i => i.ClientId);
        });

        modelBuilder.Entity<Contact>(e =>
        {
            e.HasIndex(c => c.Name);
            e.HasIndex(c => c.Type);
        });

        modelBuilder.Entity<Employee>(e =>
        {
            e.HasIndex(e => e.Status);
            e.HasIndex(e => e.TenantId);
        });

        modelBuilder.Entity<StockMovement>(e =>
        {
            e.HasIndex(s => s.ProductId);
            e.HasIndex(s => s.Type);
        });

        modelBuilder.Entity<ActivityLog>(e =>
        {
            e.HasIndex(a => new { a.TenantId, a.Action });
            e.HasIndex(a => a.UserId);
        });

        modelBuilder.Entity<AuditLog>(e =>
        {
            e.HasIndex(a => new { a.EntityType, a.UserId });
            e.HasIndex(a => a.UserId);
        });

        modelBuilder.Entity<PurchaseOrder>(e =>
        {
            e.HasIndex(p => p.Status);
            e.HasIndex(p => p.CreatedBy);
        });

        modelBuilder.Entity<InventoryItem>(e =>
        {
            e.HasIndex(i => i.Active);
            e.HasIndex(i => i.TenantId);
        });

        modelBuilder.Entity<RefreshToken>(e =>
        {
            e.HasKey(r => r.Id);
            e.Property(r => r.Id).HasMaxLength(36);
            e.Property(r => r.UserId).HasMaxLength(36);
            e.Property(r => r.Token).HasMaxLength(512);
            e.HasIndex(r => r.Token).IsUnique();
            e.HasIndex(r => r.UserId);
            // IsActive, IsExpired, IsRevoked are computed — not persisted
            e.Ignore(r => r.IsActive);
            e.Ignore(r => r.IsExpired);
            e.Ignore(r => r.IsRevoked);
        });

        modelBuilder.Entity<Sale>(e =>
        {
            e.HasIndex(s => s.ProductId);
        });

        modelBuilder.Entity<SurveyResponse>(e =>
        {
            e.HasIndex(sr => sr.SurveyId);
        });

        modelBuilder.Entity<Deduction>(e =>
        {
            e.HasIndex(d => new { d.TenantId, d.EmployeeId });
        });

        modelBuilder.Entity<Payroll>(e =>
        {
            e.HasIndex(p => new { p.TenantId, p.Status });
            e.HasIndex(p => new { p.TenantId, p.EmployeeId });
        });

        modelBuilder.Entity<Vacation>(e =>
        {
            e.HasIndex(v => new { v.TenantId, v.Status });
        });

        modelBuilder.Entity<Attendance>(e =>
        {
            e.HasIndex(a => new { a.TenantId, a.Date });
        });

        modelBuilder.Entity<Permission>(e =>
        {
            e.HasIndex(p => new { p.UserId, p.Module }).IsUnique();
        });

        // Chart of accounts — unique per tenant+code
        modelBuilder.Entity<ChartAccount>()
            .HasIndex(x => new { x.TenantId, x.Code })
            .IsUnique();

        // NCF sequences — unique per type+tenant
        modelBuilder.Entity<NcfSequence>()
            .HasIndex(x => new { x.TenantId, x.NcfType })
            .IsUnique();

        // Accounting reporting indexes
        modelBuilder.Entity<JournalEntry>()
            .HasIndex(x => new { x.TenantId, x.Date });
        modelBuilder.Entity<AccountsReceivable>()
            .HasIndex(x => new { x.TenantId, x.Status });
        modelBuilder.Entity<AccountsPayable>()
            .HasIndex(x => new { x.TenantId, x.Status });
        modelBuilder.Entity<IncomeRecord>()
            .HasIndex(x => new { x.TenantId, x.Date });
        modelBuilder.Entity<CostRecord>()
            .HasIndex(x => new { x.TenantId, x.Date });

        modelBuilder.Entity<TaskItem>(e =>
        {
            e.Property(t => t.Id).HasMaxLength(36);
            e.Property(t => t.Title).HasMaxLength(512);
            e.Property(t => t.Status).HasMaxLength(20);
            e.Property(t => t.Priority).HasMaxLength(20);
            e.HasIndex(t => t.Status);
            e.HasOne(t => t.User)
                .WithMany()
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Meeting>(e =>
        {
            e.Property(m => m.Id).HasMaxLength(36);
            e.Property(m => m.Title).HasMaxLength(512);
            e.Property(m => m.Type).HasMaxLength(20);
            e.HasIndex(m => m.StartDate);
            e.HasOne(m => m.User)
                .WithMany()
                .HasForeignKey(m => m.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
