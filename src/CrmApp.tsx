import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  LayoutDashboard,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Sparkles,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import seedData from '../data/crm.json'
import './CrmApp.css'

type Customer = {
  id: string
  name: string
  email: string
  phone: string
  region: string
  customerSince: string
  lastOrder: string
  totalOrders: number
  totalSpend: number
  accountManager: string
  tags: string[]
  notes: string
}

type OrderStatus = 'scheduled' | 'in-production' | 'completed' | 'cancelled'

type ProductionOrder = {
  id: string
  customerId: string
  customerName: string
  date: string
  time: string
  duration: number
  product: string
  productionLine: string
  status: OrderStatus
  value: number
  notes: string
}

type Task = { id: string; title: string; due: string; completed: boolean }
type Product = { duration: number; value: number }
type CrmData = {
  customers: Customer[]
  orders: ProductionOrder[]
  tasks: Task[]
  accountManagers: string[]
  productionLines: string[]
  products: Record<string, Product>
}
type View = 'dashboard' | 'customers'

const studyDate = '2026-09-09'
const storageKey = 'soaply.crm.v1'
const accountManagers = ['Maya Chen', 'Sofia Reyes', 'Jordan Blake']
const productionLines = ['Line A · Cold process', 'Line B · Liquid soap', 'Line C · Finishing']
const products: Record<string, Product> = {
  'Cedar Hand Soap · 240 units': { duration: 60, value: 2880 },
  'Citrus Dish Soap · 300 units': { duration: 75, value: 3450 },
  'Unscented Bar Soap · 400 units': { duration: 45, value: 3200 },
  'Lavender Hand Soap · 180 units': { duration: 30, value: 2160 },
  'Oat Milk Bar Soap · 500 units': { duration: 90, value: 4250 },
}
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const statusLabels: Record<OrderStatus, string> = {
  scheduled: 'Scheduled',
  'in-production': 'In production',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

type StoredCrmData = Pick<CrmData, 'customers' | 'orders' | 'tasks'>

function getSeedData(): StoredCrmData {
  return structuredClone(seedData) as StoredCrmData
}

function readStoredData(): StoredCrmData {
  try {
    const storedData = window.localStorage.getItem(storageKey)
    if (storedData) return JSON.parse(storedData) as StoredCrmData
  } catch {
    return getSeedData()
  }

  const initialData = getSeedData()
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(initialData))
  } catch {
    // The in-memory copy still lets the demo run when storage is unavailable.
  }
  return initialData
}

function updateStoredData(update: (current: StoredCrmData) => StoredCrmData) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(update(readStoredData())))
    return true
  } catch {
    return false
  }
}

function loadCrmData(): CrmData {
  return { ...readStoredData(), accountManagers, productionLines, products }
}

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2)
}

function App() {
  const [data, setData] = useState<CrmData>(loadCrmData)
  const [view, setView] = useState<View>('dashboard')
  const [query, setQuery] = useState('')
  const [orderOpen, setOrderOpen] = useState(false)
  const [activeOrder, setActiveOrder] = useState<ProductionOrder | null>(null)
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(timeout)
  }, [toast])

  function openUnavailable(label: string) {
    setToast(`${label} is not available in this workspace.`)
  }

  function createOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const customer = data.customers.find((candidate) => candidate.id === form.get('customerId'))
    const product = String(form.get('product'))
    const productDetails = data.products[product]
    if (!customer || !productDetails) {
      setToast('Production order could not be saved.')
      return
    }

    const order: ProductionOrder = {
      id: crypto.randomUUID(),
      customerId: customer.id,
      customerName: customer.name,
      date: String(form.get('date')),
      time: String(form.get('time')),
      duration: productDetails.duration,
      product,
      productionLine: String(form.get('productionLine')),
      status: 'scheduled',
      value: productDetails.value,
      notes: String(form.get('notes')).trim(),
    }
    if (!updateStoredData((current) => ({ ...current, orders: [...current.orders, order] }))) {
      setToast('Production order could not be saved.')
      return
    }
    setData((current) => ({ ...current, orders: [...current.orders, order] }))
    setOrderOpen(false)
    setToast('Production order scheduled')
  }

  function updateOrderStatus(status: OrderStatus) {
    if (!activeOrder) return
    const updated = { ...activeOrder, status }
    if (!updateStoredData((current) => ({
      ...current,
      orders: current.orders.map((order) => order.id === updated.id ? updated : order),
    }))) {
      setToast('Status could not be updated.')
      return
    }
    setActiveOrder(updated)
    setData((current) => ({
      ...current,
      orders: current.orders.map((order) => order.id === updated.id ? updated : order),
    }))
    setToast('Production order updated')
  }

  function saveCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!activeCustomer) return
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email')).trim()
    const phone = String(form.get('phone')).trim()
    const accountManager = String(form.get('accountManager'))
    const notes = String(form.get('notes'))
    const persistedUpdate = { email, phone, accountManager }
    if (!updateStoredData((current) => ({
      ...current,
      customers: current.customers.map((customer) => customer.id === activeCustomer.id
        ? { ...customer, ...persistedUpdate }
        : customer),
    }))) {
      setToast('Customer could not be saved.')
      return
    }
    const locallyUpdated = { ...activeCustomer, ...persistedUpdate, notes }
    setActiveCustomer(locallyUpdated)
    setData((current) => ({
      ...current,
      customers: current.customers.map((customer) => customer.id === locallyUpdated.id ? locallyUpdated : customer),
    }))
    setToast('Customer changes saved')
  }

  const todayOrders = data.orders.filter((order) => order.date === studyDate)
  const filteredCustomers = data.customers.filter((customer) => customer.name.toLowerCase().startsWith(query.toLowerCase().trim()))

  return (
    <div className="crm-shell">
      <aside className="sidebar">
        <div className="brand"><span><Sparkles size={17} /></span>Soaply</div>
        <p className="workspace-label">Factory CRM</p>
        <nav aria-label="Workspace navigation">
          <button className={view === 'dashboard' ? 'active' : ''} type="button" onClick={() => { setView('dashboard'); setActiveCustomer(null) }}><LayoutDashboard />Overview</button>
          <button type="button" onClick={() => openUnavailable('Production')}><CalendarDays />Production</button>
          <button className={view === 'customers' ? 'active' : ''} type="button" onClick={() => { setView('customers'); setActiveCustomer(null) }}><UsersRound />Customers</button>
          <button type="button" onClick={() => openUnavailable('Tasks')}><ClipboardList />Tasks<span className="nav-count">3</span></button>
        </nav>
        <div className="sidebar-bottom">
          <button type="button" onClick={() => openUnavailable('Settings')}><Settings />Settings</button>
          <div className="user-card"><span className="avatar avatar-small">OL</span><div><strong>Olivia Lane</strong><small>Sales operations</small></div><ChevronDown size={15} /></div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="mobile-brand">Soaply</div>
          <label className="global-search"><Search size={17} /><input aria-label="Search workspace" placeholder="Search customers, orders..." /></label>
          <div className="topbar-actions">
            <button className="icon-button" type="button" aria-label="Notifications" onClick={() => openUnavailable('Notifications')}><Bell size={19} /><i /></button>
            <button className="primary-button" type="button" onClick={() => setOrderOpen(true)}><Plus size={17} />New production order</button>
          </div>
        </header>

        {view === 'dashboard' ? (
          <Dashboard
            orders={todayOrders}
            tasks={data.tasks}
            onOrder={setActiveOrder}
            onNew={() => setOrderOpen(true)}
          />
        ) : activeCustomer ? (
          <CustomerProfile customer={activeCustomer} accountManagers={data.accountManagers} orders={data.orders} onBack={() => setActiveCustomer(null)} onSave={saveCustomer} />
        ) : (
          <Customers customers={filteredCustomers} query={query} onQuery={setQuery} onCustomer={setActiveCustomer} />
        )}
      </section>

      {orderOpen && <OrderModal data={data} onClose={() => setOrderOpen(false)} onSubmit={createOrder} />}
      {activeOrder && <OrderDrawer order={activeOrder} onClose={() => setActiveOrder(null)} onStatus={updateOrderStatus} />}
      {toast && <div className="toast" role="status"><Check size={16} />{toast}</div>}
    </div>
  )
}

function Dashboard({ orders, tasks, onOrder, onNew }: {
  orders: ProductionOrder[]
  tasks: Task[]
  onOrder: (order: ProductionOrder) => void
  onNew: () => void
}) {
  const pipelineValue = orders.reduce((total, order) => total + order.value, 0)
  const completed = orders.filter((order) => order.status === 'completed').length

  return (
    <main className="page dashboard-page">
      <div className="page-heading"><div><p className="eyebrow">Wednesday, September 9</p><h1>Good morning, Olivia</h1><p>Here is what is moving through the factory today.</p></div><button className="secondary-button" type="button" onClick={onNew}><Plus size={16} />Schedule run</button></div>
      <section className="metrics" aria-label="Today's summary">
        <article><span className="metric-icon coral"><CalendarDays /></span><div><small>Production orders</small><strong>{orders.length}</strong><p>2 still to confirm</p></div></article>
        <article><span className="metric-icon green"><CircleDollarSign /></span><div><small>Pipeline value</small><strong>{money.format(pipelineValue)}</strong><p>12% above Wednesday avg.</p></div></article>
        <article><span className="metric-icon gold"><Clock3 /></span><div><small>Line utilization</small><strong>78%</strong><p>4h 10m open capacity</p></div></article>
        <article><span className="metric-icon lilac"><Check /></span><div><small>Completed</small><strong>{completed}</strong><p>of {orders.length} production runs</p></div></article>
      </section>
      <div className="dashboard-grid">
        <section className="panel schedule-panel">
          <div className="panel-heading"><div><h2>Today's production plan</h2><p>{orders.length} orders across 3 production lines</p></div><button className="text-button" type="button">View board</button></div>
          <div className="appointment-list">
            {orders.map((order) => (
              <button className="appointment-row" type="button" key={order.id} onClick={() => onOrder(order)}>
                <time>{order.time}<small>{order.duration} min</small></time>
                <span className={`avatar tone-${order.customerName.length % 4}`}>{initials(order.customerName)}</span>
                <span className="appointment-main"><strong>{order.customerName}</strong><small>{order.product}</small></span>
                <span className="specialist"><i />{order.productionLine}</span>
                <span className={`status status-${order.status}`}>{statusLabels[order.status]}</span>
                <MoreHorizontal size={18} />
              </button>
            ))}
          </div>
        </section>
        <aside className="panel tasks-panel">
          <div className="panel-heading"><div><h2>Tasks</h2><p>{tasks.length} due today</p></div><button className="icon-button compact" type="button"><Plus size={17} /></button></div>
          <div className="task-list">
            {tasks.map((task) => <label key={task.id}><input type="checkbox" /><span><strong>{task.title}</strong><small>{task.due}</small></span></label>)}
          </div>
          <button className="all-tasks" type="button">All tasks</button>
        </aside>
      </div>
    </main>
  )
}

function Customers({ customers, query, onQuery, onCustomer }: { customers: Customer[]; query: string; onQuery: (value: string) => void; onCustomer: (customer: Customer) => void }) {
  return (
    <main className="page clients-page">
      <div className="page-heading"><div><p className="eyebrow">Sales relationships</p><h1>Customers</h1><p>Wholesale accounts, requirements, and order history.</p></div><button className="primary-button" type="button"><Plus size={17} />Add customer</button></div>
      <section className="panel client-panel">
        <div className="client-toolbar"><label><Search size={17} /><input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search customers" /></label><button type="button">All customers<ChevronDown size={15} /></button></div>
        <div className="client-table-header"><span>Customer</span><span>Last order</span><span>Orders</span><span>Total value</span><span>Account manager</span><span /></div>
        {customers.map((customer) => (
          <button className="client-row" type="button" key={customer.id} onClick={() => onCustomer(customer)}>
            <span className="client-identity"><i className={`avatar tone-${customer.name.length % 4}`}>{initials(customer.name)}</i><span><strong>{customer.name}</strong><small>{customer.email}</small></span></span>
            <span>{customer.lastOrder}</span><span>{customer.totalOrders}</span><span>{money.format(customer.totalSpend)}</span><span>{customer.accountManager}</span><MoreHorizontal size={18} />
          </button>
        ))}
        {customers.length === 0 && <div className="empty-result"><UserRound /><h2>No customers found</h2><p>Try a different company name.</p></div>}
      </section>
    </main>
  )
}

function CustomerProfile({ customer, accountManagers, orders, onBack, onSave }: { customer: Customer; accountManagers: string[]; orders: ProductionOrder[]; onBack: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void }) {
  const history = orders.filter((order) => order.customerId === customer.id)
  return (
    <main className="page profile-page">
      <button className="back-button" type="button" onClick={onBack}><ArrowLeft size={16} />Back to customers</button>
      <div className="profile-heading"><span className={`avatar profile-avatar tone-${customer.name.length % 4}`}>{initials(customer.name)}</span><div><h1>{customer.name}</h1><p>Customer since {customer.customerSince}</p><div className="tag-list">{customer.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div><button className="primary-button" type="button"><Plus size={16} />Create order</button></div>
      <div className="profile-grid">
        <form className="panel profile-form" onSubmit={onSave}>
          <div className="panel-heading"><div><h2>Customer details</h2><p>Account contacts and fulfillment requirements</p></div></div>
          <div className="form-grid"><label>Email<input name="email" type="email" defaultValue={customer.email} required /></label><label>Phone<input name="phone" defaultValue={customer.phone} required /></label><label>Region<input value={customer.region} readOnly /></label><label>Account manager<select name="accountManager" defaultValue={customer.accountManager}>{accountManagers.map((name) => <option key={name}>{name}</option>)}</select></label><label className="wide">Internal notes<textarea name="notes" defaultValue={customer.notes} rows={5} /></label></div>
          <div className="form-actions"><button className="primary-button" type="submit">Save changes</button></div>
        </form>
        <aside className="profile-side">
          <section className="panel profile-stats"><div><small>Total orders</small><strong>{customer.totalOrders}</strong></div><div><small>Lifetime value</small><strong>{money.format(customer.totalSpend)}</strong></div><div><small>Last order</small><strong>{customer.lastOrder}</strong></div></section>
          <section className="panel history"><div className="panel-heading"><div><h2>Recent orders</h2><p>Latest factory order history</p></div></div>{history.length ? history.map((order) => <div className="history-row" key={order.id}><span><strong>{order.product}</strong><small>{order.date} on {order.productionLine}</small></span><span className={`status status-${order.status}`}>{statusLabels[order.status]}</span></div>) : <p className="muted">No recent orders.</p>}</section>
        </aside>
      </div>
    </main>
  )
}

function OrderModal({ data, onClose, onSubmit }: { data: CrmData; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="overlay" role="presentation" onMouseDown={onClose}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="order-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading"><div><p className="eyebrow">Production planning</p><h2 id="order-title">New production order</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X /></button></div>
        <form onSubmit={onSubmit}>
          <label className="wide">Customer<select name="customerId" defaultValue="" required><option value="" disabled>Select a customer</option>{data.customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name}</option>)}</select></label>
          <label>Date<input name="date" type="date" defaultValue={studyDate} required /></label><label>Start time<input name="time" type="time" defaultValue="10:00" required /></label>
          <label className="wide">Product batch<select name="product" defaultValue="" required><option value="" disabled>Select a soap product</option>{Object.entries(data.products).map(([name, product]) => <option key={name} value={name}>{name} - {product.duration} min - {money.format(product.value)}</option>)}</select></label>
          <label className="wide">Production line<select name="productionLine" defaultValue="" required><option value="" disabled>Select a production line</option>{data.productionLines.map((name) => <option key={name}>{name}</option>)}</select></label>
          <label className="wide">Production notes<textarea name="notes" rows={3} placeholder="Packaging, formula, or fulfillment requirements" /></label>
          <div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit">Schedule production</button></div>
        </form>
      </section>
    </div>
  )
}

function OrderDrawer({ order, onClose, onStatus }: { order: ProductionOrder; onClose: () => void; onStatus: (status: OrderStatus) => void }) {
  return (
    <div className="overlay drawer-overlay" role="presentation" onMouseDown={onClose}>
      <aside className="appointment-drawer" role="dialog" aria-modal="true" aria-label="Production order details" onMouseDown={(event) => event.stopPropagation()}>
        <div className="drawer-heading"><p className="eyebrow">Production order</p><button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X /></button></div>
        <div className="drawer-client"><span className={`avatar profile-avatar tone-${order.customerName.length % 4}`}>{initials(order.customerName)}</span><h2>{order.customerName}</h2><span className={`status status-${order.status}`}>{statusLabels[order.status]}</span></div>
        <dl><div><dt>Date</dt><dd>Wednesday, September 9</dd></div><div><dt>Start</dt><dd>{order.time} ({order.duration} min)</dd></div><div><dt>Product</dt><dd>{order.product}</dd></div><div><dt>Line</dt><dd>{order.productionLine}</dd></div><div><dt>Order value</dt><dd>{money.format(order.value)}</dd></div><div><dt>Notes</dt><dd>{order.notes || 'No notes added'}</dd></div></dl>
        <div className="drawer-actions"><label>Status<select value={order.status} onChange={(event) => onStatus(event.target.value as OrderStatus)}>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><button className="secondary-button" type="button">Edit production order</button></div>
      </aside>
    </div>
  )
}

export default App