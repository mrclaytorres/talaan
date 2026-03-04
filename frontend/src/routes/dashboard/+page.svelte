<script lang="ts">
	import { onMount } from 'svelte';
	import { tradesStore } from '$lib/stores/trades.svelte.js';
	import { accountsStore } from '$lib/stores/accounts.svelte.js';
	import { getDataService } from '$lib/services/index.js';
	import { formatDate, formatPrice, formatCurrency, formatPercent } from '$lib/utils/formatters.js';
	import type { TradeStatus, TradePosition } from '$lib/types/index.js';
	import type { DailyPnLRow, MonthlyPnLRow, DashboardSummary, TickerDistributionRow } from '$lib/services/types.js';
	import type { DailyPnL, MonthlyPnL } from '$lib/utils/pnl.js';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import RRBadge from '$lib/components/trade/RRBadge.svelte';
	import PnLChart from '$lib/components/charts/PnLChart.svelte';
	import TickerPieChart from '$lib/components/charts/TickerPieChart.svelte';
	import { goto } from '$app/navigation';
	import CalendarMonth from '$lib/components/calendar/CalendarMonth.svelte';
	import CalendarYear from '$lib/components/calendar/CalendarYear.svelte';
	import DayDetail from '$lib/components/calendar/DayDetail.svelte';
	import AccountSwitcher from '$lib/components/account/AccountSwitcher.svelte';

	// ─── Trades table state ───
	let statusFilter = $state<TradeStatus | 'all'>('all');

	async function loadTrades() {
		const filters: Record<string, unknown> = {};
		if (statusFilter !== 'all') {
			filters.status = statusFilter;
		}
		if (accountsStore.activeAccountId !== 'all') {
			filters.accountId = accountsStore.activeAccountId;
		}
		await tradesStore.loadTrades(filters);
	}

	function handleFilterChange() {
		loadTrades();
	}

	function getPnlClass(pnlPercent: number | null): string {
		if (pnlPercent === null) return '';
		return pnlPercent >= 0 ? 'pnl-positive' : 'pnl-negative';
	}

	async function loadPage(page: number) {
		const filters: Record<string, unknown> = { page };
		if (statusFilter !== 'all') {
			filters.status = statusFilter;
		}
		if (accountsStore.activeAccountId !== 'all') {
			filters.accountId = accountsStore.activeAccountId;
		}
		await tradesStore.loadTrades(filters);
	}

	// ─── Aggregated dashboard data ───
	let dailyPnLRows = $state<DailyPnLRow[]>([]);
	let monthlyPnLRows = $state<MonthlyPnLRow[]>([]);
	let dashboardSummary = $state<DashboardSummary>({
		totalPnl: 0, totalClosedTrades: 0, wins: 0, losses: 0,
		todayAmount: 0, todayPercent: 0, todayCount: 0,
	});
	let tickerDistData = $state<TickerDistributionRow[]>([]);
	let calendarLoading = $state(true);

	// Derive Map<string, DailyPnL> for calendar components
	const dailyPnL = $derived.by(() => {
		const map = new Map<string, DailyPnL>();
		for (const row of dailyPnLRows) {
			map.set(row.date, { amount: row.amount, percent: row.percent, tradeCount: row.tradeCount });
		}
		return map;
	});

	const monthlyPnL = $derived.by(() => {
		const map = new Map<string, MonthlyPnL>();
		for (const row of monthlyPnLRows) {
			map.set(row.month, { amount: row.amount, percent: row.percent, tradingDays: row.tradingDays });
		}
		return map;
	});

	// Stat card derivations — O(1) from summary
	const todayPnl = $derived(() => ({
		amount: dashboardSummary.todayAmount,
		percent: dashboardSummary.todayPercent,
		count: dashboardSummary.todayCount,
	}));

	const fundStanding = $derived(() => {
		const accounts = accountsStore.accounts;
		const activeId = accountsStore.activeAccountId;
		const relevant = activeId === 'all' ? accounts : accounts.filter((a) => String(a.id) === activeId);
		const startingCapital = relevant.reduce((sum, a) => sum + (a.startingCapital ?? 0), 0);
		return { balance: startingCapital + dashboardSummary.totalPnl, startingCapital };
	});

	const winRate = $derived(() => {
		if (dashboardSummary.totalClosedTrades === 0) return null;
		return Math.round((dashboardSummary.wins / dashboardSummary.totalClosedTrades) * 100);
	});

	// ─── Calendar state ───
	type ViewMode = 'monthly' | 'yearly';

	const now = new Date();
	let viewMode = $state<ViewMode>('monthly');
	let currentYear = $state(now.getFullYear());
	let currentMonth = $state(now.getMonth());

	let selectedDate = $state<string | null>(null);
	let dayDetailOpen = $state(false);
	let dayDetailTrades = $state<TradePosition[]>([]);

	async function loadDashboardData() {
		calendarLoading = true;
		try {
			const ds = getDataService();
			const accountId = accountsStore.activeAccountId !== 'all' ? accountsStore.activeAccountId : undefined;
			const [daily, monthly, summary, ticker] = await Promise.all([
				ds.getDailyPnL(accountId),
				ds.getMonthlyPnL(accountId),
				ds.getDashboardSummary(accountId),
				ds.getTickerDistribution(accountId),
			]);
			dailyPnLRows = daily;
			monthlyPnLRows = monthly;
			dashboardSummary = summary;
			tickerDistData = ticker;
		} finally {
			calendarLoading = false;
		}
	}

	async function handleDayClick(date: string) {
		// Check if any daily row exists for this date
		const hasTradesForDay = dailyPnLRows.some((r) => r.date === date);
		if (!hasTradesForDay) {
			goto(`/trades/new?date=${date}`);
		} else {
			selectedDate = date;
			dayDetailOpen = true;
			// Fetch trades for this specific date on demand
			const ds = getDataService();
			const accountId = accountsStore.activeAccountId !== 'all' ? accountsStore.activeAccountId : undefined;
			dayDetailTrades = await ds.getTradesForDate(date, accountId);
		}
	}

	function handleMonthClick(year: number, month: number) {
		currentYear = year;
		currentMonth = month;
		viewMode = 'monthly';
	}

	function prevMonth() {
		if (currentMonth === 0) {
			currentMonth = 11;
			currentYear -= 1;
		} else {
			currentMonth -= 1;
		}
	}

	function nextMonth() {
		if (currentMonth === 11) {
			currentMonth = 0;
			currentYear += 1;
		} else {
			currentMonth += 1;
		}
	}

	// ─── Reload on account change ───
	let prevAccountId = $state(accountsStore.activeAccountId);
	$effect(() => {
		const currentId = accountsStore.activeAccountId;
		if (currentId !== prevAccountId) {
			prevAccountId = currentId;
			loadTrades();
			loadDashboardData();
		}
	});

	// ─── Init ───
	onMount(() => {
		loadTrades();
		loadDashboardData();
	});
</script>

<div class="dashboard-page">
	<!-- ACCOUNT SWITCHER — mobile only -->
	<div class="mobile-account-switcher">
		<AccountSwitcher />
	</div>

	<!-- STAT CARDS -->
	<div class="stat-grid">
		<div class="stat-card">
			<div class="stat-header">
				<span class="stat-label">Today's P&L</span>
				<svg class="stat-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="m7 16 4-8 4 4 4-8"/></svg>
			</div>
			<div class="stat-value" class:text-positive={todayPnl().amount > 0} class:text-negative={todayPnl().amount < 0}>
				{formatCurrency(todayPnl().amount)}
			</div>
			<div class="stat-sub">
				{#if todayPnl().amount !== 0}
					<span class:text-positive={todayPnl().percent > 0} class:text-negative={todayPnl().percent < 0}>
						{formatPercent(todayPnl().percent)}
					</span>
				{/if}
				{todayPnl().count} trades closed
			</div>
		</div>
		<div class="stat-card">
			<div class="stat-header">
				<span class="stat-label">Current Fund</span>
				<svg class="stat-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
			</div>
			<div class="stat-value" class:text-positive={fundStanding().balance > fundStanding().startingCapital} class:text-negative={fundStanding().balance < fundStanding().startingCapital}>
				{formatCurrency(fundStanding().balance)}
			</div>
			<div class="stat-sub">started at {formatCurrency(fundStanding().startingCapital)}</div>
		</div>
		<div class="stat-card">
			<div class="stat-header">
				<span class="stat-label">Win Rate</span>
				<svg class="stat-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
			</div>
			<div class="stat-value">{winRate() !== null ? `${winRate()}%` : '--'}</div>
			<div class="stat-sub">{dashboardSummary.totalClosedTrades} closed trades</div>
		</div>
		<div class="stat-card">
			<div class="stat-header">
				<span class="stat-label">Total Trades</span>
				<svg class="stat-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
			</div>
			<div class="stat-value">{tradesStore.trades.length}</div>
			<div class="stat-sub">all time</div>
		</div>
	</div>

	<!-- CALENDAR -->
	<div class="calendar-section">
		<div class="calendar-header">
			<h2>Calendar</h2>
			<div class="view-tabs">
				<button
					class="view-tab"
					class:active={viewMode === 'monthly'}
					onclick={() => (viewMode = 'monthly')}
				>
					Monthly
				</button>
				<button
					class="view-tab"
					class:active={viewMode === 'yearly'}
					onclick={() => (viewMode = 'yearly')}
				>
					Yearly
				</button>
			</div>
		</div>

		{#if calendarLoading}
			<LoadingSpinner message="Loading P&L data..." />
		{:else if viewMode === 'monthly'}
			<CalendarMonth
				year={currentYear}
				month={currentMonth}
				{dailyPnL}
				ondayclick={handleDayClick}
				onprev={prevMonth}
				onnext={nextMonth}
			/>
		{:else}
			<CalendarYear
				year={currentYear}
				{monthlyPnL}
				onmonthclick={handleMonthClick}
				onprev={() => (currentYear -= 1)}
				onnext={() => (currentYear += 1)}
			/>
		{/if}

		{#if selectedDate}
			<DayDetail
				bind:open={dayDetailOpen}
				date={selectedDate}
				trades={dayDetailTrades}
				onclose={() => {
					dayDetailOpen = false;
					selectedDate = null;
					dayDetailTrades = [];
				}}
			/>
		{/if}
	</div>

	<!-- CHARTS -->
	{#if dashboardSummary.totalClosedTrades > 0}
		<div class="charts-grid">
			<PnLChart dailyData={dailyPnLRows} />
			<TickerPieChart distributionData={tickerDistData} />
		</div>
	{/if}

	<!-- TABLE SECTION -->
	<div class="section">
		<div class="section-bar">
			<div class="tab-bar">
				<button class="tab" class:active={statusFilter === 'all'} onclick={() => { statusFilter = 'all'; handleFilterChange(); }}>All</button>
				<button class="tab" class:active={statusFilter === 'open'} onclick={() => { statusFilter = 'open'; handleFilterChange(); }}>Open</button>
				<button class="tab" class:active={statusFilter === 'closed'} onclick={() => { statusFilter = 'closed'; handleFilterChange(); }}>Closed</button>
			</div>
			<a href="/trades/new">
				<Button>+ New Trade</Button>
			</a>
		</div>

		{#if tradesStore.isLoading}
			<LoadingSpinner message="Loading trades..." />
		{:else if tradesStore.trades.length === 0}
			<EmptyState message="No trades yet. Add your first trade to get started." icon="📈">
				{#snippet action()}
					<a href="/trades/new">
						<Button>Add Trade</Button>
					</a>
				{/snippet}
			</EmptyState>
		{:else}
			<div class="data-table">
				<table>
					<thead>
						<tr>
							<th>Ticker</th>
							<th>Dir</th>
							<th class="hide-mobile">Entry</th>
							<th class="hide-mobile">SL</th>
							<th class="hide-mobile">TP</th>
							<th>R:R</th>
							<th>Status</th>
							<th>P&L</th>
						</tr>
					</thead>
					<tbody>
						{#each tradesStore.trades as trade (trade.id)}
							<tr>
								<td>
									<a href="/trades/{trade.id}" class="trade-link">
										<span class="ticker">{trade.tickerSymbol}</span>
									</a>
									<span class="trade-date">{formatDate(trade.date, undefined, 'short')}</span>
								</td>
								<td>
									<Badge variant={trade.direction === 'long' ? 'success' : 'danger'}>
										{trade.direction === 'long' ? 'LONG' : 'SHORT'}
									</Badge>
								</td>
								<td class="hide-mobile mono">{formatPrice(trade.entryPrice)}</td>
								<td class="hide-mobile mono">{formatPrice(trade.stopLoss)}</td>
								<td class="hide-mobile mono">{formatPrice(trade.takeProfit)}</td>
								<td><RRBadge ratio={trade.rrRatio} /></td>
								<td>
									<Badge variant={trade.status === 'open' ? 'warning' : 'default'}>
										{trade.status === 'open' ? 'OPEN' : 'CLOSED'}
									</Badge>
								</td>
								<td class={getPnlClass(trade.pnlPercent)}>
									{#if trade.pnlPercent !== null}
										<span class="pnl-amount">
											{#if trade.pnlAmount !== null}
												{formatCurrency(trade.pnlAmount)}
											{/if}
										</span>
										<span class="pnl-percent">
											{formatPercent(trade.pnlPercent)}
										</span>
									{:else}
										<span class="pnl-na">&mdash;</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			{#if tradesStore.totalPages > 1}
				<div class="pagination">
					<Button
						variant="secondary"
						size="sm"
						onclick={() => loadPage(tradesStore.currentPage - 1)}
						disabled={tradesStore.currentPage <= 1}
					>
						Previous
					</Button>
					<span class="page-info">
						Page {tradesStore.currentPage} of {tradesStore.totalPages}
					</span>
					<Button
						variant="secondary"
						size="sm"
						onclick={() => loadPage(tradesStore.currentPage + 1)}
						disabled={tradesStore.currentPage >= tradesStore.totalPages}
					>
						Next
					</Button>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.dashboard-page {
		max-width: 1200px;
		margin: 0 auto;
	}

	/* ─── MOBILE ACCOUNT SWITCHER ─── */
	.mobile-account-switcher {
		display: block;
		margin-bottom: 12px;
	}

	@media (min-width: 768px) {
		.mobile-account-switcher {
			display: none;
		}
	}

	/* ─── STAT GRID ─── */
	.stat-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 12px;
		margin-bottom: 20px;
	}

	.stat-card {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 16px 18px;
		transition: border-color 150ms ease;
	}

	.stat-card:hover {
		border-color: var(--text-muted);
	}

	.stat-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8px;
	}

	.stat-label {
		font-size: 12px;
		font-weight: 500;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.stat-icon {
		color: var(--text-muted);
	}

	.stat-value {
		font-family: var(--font-mono);
		font-size: 22px;
		font-weight: 600;
		letter-spacing: -0.02em;
	}

	.stat-sub {
		font-size: 12px;
		color: var(--text-muted);
		margin-top: 4px;
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.text-positive {
		color: var(--positive-text);
	}

	.text-negative {
		color: var(--negative-text);
	}

	/* ─── CALENDAR SECTION ─── */
	.calendar-section {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 16px 18px;
		margin-bottom: 20px;
	}

	.calendar-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.calendar-header h2 {
		font-size: 1rem;
		font-weight: 600;
		margin: 0;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-size: 12px;
	}

	.view-tabs {
		display: flex;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm, 0.375rem);
		overflow: hidden;
	}

	.view-tab {
		padding: 0.375rem 0.75rem;
		border: none;
		background: var(--bg-surface);
		color: var(--text-muted);
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.view-tab:not(:last-child) {
		border-right: 1px solid var(--border);
	}

	.view-tab.active {
		background: var(--accent, #2563eb);
		color: white;
	}

	.view-tab:not(.active):hover {
		background: var(--bg-elevated);
	}

	/* ─── CHARTS GRID ─── */
	.charts-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		margin-bottom: 20px;
	}

	/* ─── SECTION ─── */
	.section {
		margin-bottom: 20px;
	}

	.section-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12px;
		gap: 12px;
		flex-wrap: wrap;
	}

	/* ─── TAB BAR ─── */
	.tab-bar {
		display: inline-flex;
		background: var(--bg-elevated);
		border-radius: var(--radius-sm);
		padding: 2px;
		gap: 2px;
	}

	.tab {
		padding: 6px 14px;
		font-size: 12px;
		font-weight: 500;
		color: var(--text-muted);
		border-radius: 4px;
		cursor: pointer;
		transition: all 150ms ease;
		border: none;
		background: transparent;
		font-family: var(--font-sans);
	}

	.tab:hover {
		color: var(--text-secondary);
	}

	.tab.active {
		background: var(--bg-surface);
		color: var(--text-primary);
		box-shadow: var(--shadow-sm);
	}

	/* ─── DATA TABLE ─── */
	.data-table {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		white-space: nowrap;
	}

	thead th {
		text-align: left;
		padding: 10px 14px;
		font-size: 11px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-bottom: 1px solid var(--border);
		background: var(--bg-surface);
	}

	tbody tr {
		border-bottom: 1px solid var(--border-subtle, var(--border));
		transition: background 150ms ease;
	}

	tbody tr:last-child {
		border-bottom: none;
	}

	tbody tr:hover {
		background: var(--bg-hover);
	}

	tbody td {
		padding: 10px 14px;
		font-size: 13px;
	}

	.mono {
		font-family: var(--font-mono);
		font-size: 12px;
		font-weight: 500;
	}

	.trade-link {
		text-decoration: none;
		color: var(--text-primary);
	}

	.trade-link:hover {
		text-decoration: underline;
		color: var(--accent-text);
	}

	.ticker {
		font-weight: 600;
		display: block;
	}

	.trade-date {
		font-size: 11px;
		color: var(--text-muted);
		display: block;
		margin-top: 1px;
	}

	.pnl-positive {
		color: var(--positive-text);
		font-weight: 600;
	}

	.pnl-negative {
		color: var(--negative-text);
		font-weight: 600;
	}

	.pnl-amount {
		display: block;
		font-family: var(--font-mono);
		font-size: 13px;
	}

	.pnl-percent {
		display: block;
		font-family: var(--font-mono);
		font-size: 11px;
		opacity: 0.8;
	}

	.pnl-na {
		color: var(--text-muted);
	}

	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.page-info {
		font-size: 0.875rem;
		color: var(--text-muted);
	}

	@media (max-width: 768px) {
		.stat-grid {
			grid-template-columns: 1fr 1fr;
		}

		.charts-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 640px) {
		.hide-mobile {
			display: none;
		}

		thead th {
			padding: 8px 8px;
			font-size: 10px;
		}

		tbody td {
			padding: 8px 8px;
			font-size: 12px;
		}

		.stat-grid {
			grid-template-columns: 1fr 1fr;
			gap: 8px;
		}

		.stat-value {
			font-size: 18px;
		}

		.calendar-section {
			padding: 8px 6px;
		}
	}
</style>
