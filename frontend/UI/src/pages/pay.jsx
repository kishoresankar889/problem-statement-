import React, { useState } from 'react'

function Pay({ onBack }) {
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem('cart')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [name, setName] = useState('')
  const [card, setCard] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [billing, setBilling] = useState('')
  const [processing, setProcessing] = useState(false)
  const [msg, setMsg] = useState(null)

  const total = cart.reduce((s, it) => s + (parseFloat(it.price || 0) * (it.quantity || 1)), 0)

  function simpleValidate() {
    if (!name.trim()) return 'Name on card is required'
    if (!/^[0-9 -]{12,19}$/.test(card)) return 'Enter a valid card number (digits only)'
    if (!/^[0-9]{3,4}$/.test(cvv)) return 'Enter a valid CVV'
    if (!/^[0-9]{2}\/[0-9]{2}$/.test(expiry)) return 'Expiry must be MM/YY'
    return null
  }

  function handlePay(e) {
    e.preventDefault()
    setMsg(null)
    const err = simpleValidate()
    if (err) {
      setMsg({ type: 'error', text: err })
      return
    }
    if (cart.length === 0) {
      setMsg({ type: 'error', text: 'Your cart is empty' })
      return
    }
    setProcessing(true)
    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false)
      setMsg({ type: 'success', text: 'Payment successful — order placed.' })
      // send order to server so admin can be notified
      async function postOrder() {
        try {
          const user = (() => { try { return JSON.parse(localStorage.getItem('user')) } catch { return null } })()
          const itemsPayload = cart.map(it => ({ id: it.id, title: it.title, qty: it.qty || it.quantity || 1, price: it.price }))
          await fetch('http://localhost:3000/orders', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userEmail: user && user.email, items: itemsPayload, total })
          })
        } catch (e) {
          console.error('Failed to post order', e)
        }
      }
      postOrder()
      localStorage.removeItem('cart')
      setCart([])
    }, 1200)
  }

  return (
    <div className="pay-page">
      <div className="pay-card">
        <div className="pay-form">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
            <button className="btn btn-ghost" type="button" onClick={() => { if(onBack) onBack() }}>Back</button>
            <h3 style={{margin:0}}>Payment Details</h3>
          </div>
          {msg && <div className={`msg ${msg.type}`}>{msg.text}</div>}
          <form onSubmit={handlePay} className="form-area">
            <div className="field">
              <label>Name on card</label>
              <input className="input" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="field">
              <label>Card information</label>
              <div className="card-inputs">
                <input className="input" placeholder="Card number" value={card} onChange={e => setCard(e.target.value)} />
                <input className="input" placeholder="MM/YY" value={expiry} onChange={e => setExpiry(e.target.value)} />
                <input className="input" placeholder="CVV" value={cvv} onChange={e => setCvv(e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label>Billing address</label>
              <input className="input" placeholder="Street, city, country" value={billing} onChange={e => setBilling(e.target.value)} />
            </div>

            <div className="pay-actions">
              <button className="btn btn-primary" type="submit" disabled={processing}>{processing ? 'Processing…' : `Pay $${total.toFixed(2)}`}</button>
              <button type="button" className="btn btn-ghost" onClick={() => { setMsg(null) }} disabled={processing}>Reset</button>
            </div>
            <div className="pay-note small">This is a mock payment flow for demo purposes only.</div>
          </form>
        </div>

        <div>
          <div className="order-summary">
            <h4>Order Summary</h4>
            {cart.length === 0 && <div className="small">Your cart is empty</div>}
            {cart.map((it, idx) => (
              <div className="summary-item" key={idx}>
                <div>
                  <div>{it.title}</div>
                  <div className="muted small">Qty: {it.quantity || 1}</div>
                </div>
                <div>${((parseFloat(it.price) || 0) * (it.quantity || 1)).toFixed(2)}</div>
              </div>
            ))}
            <div className="total"><div>Total</div><div>${total.toFixed(2)}</div></div>
          </div>
          <div className="pay-note small">No card details are stored or transmitted — demo only.</div>
        </div>
      </div>
    </div>
  )
}

export default Pay
