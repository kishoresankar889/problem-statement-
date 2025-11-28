import React, { useState, useEffect, useRef } from 'react'

export default function Orders({ onBack }){
  const [orders, setOrders] = useState([])
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [highlight, setHighlight] = useState(-1)
  const rotateRef = useRef(null)

  async function fetchOrders(){
    setLoading(true); setError(null)
    try{
      const u = JSON.parse(localStorage.getItem('user')||'null');
      const headers = {}
      if(u && u.email) headers['x-admin-email'] = u.email
      const url = 'http://localhost:3000/orders' + (includeDeleted ? '?includeDeleted=true' : '')
      const res = await fetch(url, { headers })
      if(!res.ok) throw new Error('Failed to fetch orders')
      const data = await res.json()
      setOrders(data || [])
      // reset highlight if needed
      if(!data || data.length === 0) setHighlight(-1)
      else setHighlight(prev => (prev >= data.length ? 0 : (prev === -1 ? 0 : prev)))
    }catch(err){ setError(err.message || String(err)) }
    finally{ setLoading(false) }
  }

  useEffect(()=>{ fetchOrders() }, [])

  useEffect(()=>{
    // rotate highlight every 60s
    if(rotateRef.current) clearInterval(rotateRef.current)
    rotateRef.current = setInterval(()=>{
      setOrders(prev=>{
        const len = Array.isArray(prev) ? prev.length : 0
        if(!len) return prev
        setHighlight(h => (h + 1) % len)
        return prev
      })
    }, 60000)
    return ()=>{ if(rotateRef.current) clearInterval(rotateRef.current) }
  }, [orders.length])

  async function markNotified(id){
    try{
      const u = JSON.parse(localStorage.getItem('user')||'null');
      const headers = { 'Content-Type': 'application/json' }
      if(u && u.email) headers['x-admin-email'] = u.email
      const res = await fetch(`http://localhost:3000/orders/${id}/notify`, { method: 'PATCH', headers })
      if(!res.ok) throw new Error('Failed to mark notified')
      await fetchOrders()
    }catch(err){ console.error(err); setError(err.message || String(err)) }
  }

  async function deleteOrder(id){
    if(!confirm('Delete this order? This action cannot be undone.')) return
    try{
      const u = JSON.parse(localStorage.getItem('user')||'null');
      const headers = { 'Content-Type': 'application/json' }
      if(u && u.email) headers['x-admin-email'] = u.email
      const res = await fetch(`http://localhost:3000/orders/${id}`, { method: 'DELETE', headers })
      if(!res.ok){
        const txt = await res.text()
        throw new Error(txt || 'Delete failed')
      }
      await fetchOrders()
    }catch(err){ console.error(err); setError(err.message || String(err)) }
  }

  async function restoreOrder(id){
    try{
      if(!confirm('Restore this order?')) return
      const u = JSON.parse(localStorage.getItem('user')||'null');
      const headers = { 'Content-Type': 'application/json' }
      if(u && u.email) headers['x-admin-email'] = u.email
      const res = await fetch(`http://localhost:3000/orders/${id}/restore`, { method: 'PATCH', headers })
      if(!res.ok){ const txt = await res.text(); throw new Error(txt || 'Restore failed') }
      await fetchOrders()
    }catch(err){ console.error(err); setError(err.message || String(err)) }
  }

  return (
    <div style={{maxWidth:820}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <h2>Orders</h2>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <label style={{display:'flex',alignItems:'center',gap:8}} className="small"><input type="checkbox" checked={includeDeleted} onChange={e=>{ setIncludeDeleted(e.target.checked); setTimeout(fetchOrders,50) }} /> Show Deleted</label>
          <button className="btn btn-ghost" onClick={fetchOrders}>Refresh</button>
          <button className="btn btn-ghost" onClick={()=>{ if(typeof onBack==='function') onBack(); }}>Back</button>
        </div>
      </div>
      {loading && <div className="small">Loading orders...</div>}
      {error && <div className="small" style={{color:'#b00020'}}>{error}</div>}
      {!loading && orders.length === 0 && <div className="small">No orders yet</div>}
      <div style={{marginTop:12}}>
        {orders.map((o, idx) => (
          <div key={o.id} style={{padding:12,marginBottom:8,background: idx===highlight ? 'rgba(10,143,47,0.06)' : 'rgba(255,255,255,0.02)',borderRadius:8,border: idx===highlight ? '1px solid rgba(10,143,47,0.2)' : '1px solid transparent'}}>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <div><strong>Order #{o.id}</strong> <span className="small" style={{color:'var(--muted)'}}>by {o.user_email || 'guest'}</span></div>
              <div className="small">{new Date(o.created_at).toLocaleString()}</div>
            </div>
            <div style={{marginTop:8}}>
              {o.items && o.items.map((it, i) => (
                <div key={i} style={{display:'flex',justifyContent:'space-between'}}>
                  <div className="small">{it.title} x{it.qty||1}</div>
                  <div className="small">${((parseFloat(it.price)||0)*(it.qty||1)).toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:8,display:'flex',gap:8,alignItems:'center'}}>
              <div className="small">Total: ${o.total}</div>
              {!o.notified && <button className="btn btn-primary small" onClick={()=>markNotified(o.id)}>Mark notified</button>}
              {o.deleted ? (
                <button className="btn btn-ghost small" style={{marginLeft:8}} onClick={()=>restoreOrder(o.id)}>Restore</button>
              ) : (
                <button className="btn btn-ghost small" style={{marginLeft:8}} onClick={()=>deleteOrder(o.id)}>Delete</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
