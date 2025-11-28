import React, {useState, useEffect} from 'react'

export default function Cart({ onRequireAuth, onBack, onCartChange, onPay }){
  const [items, setItems] = useState([])
  const [msg, setMsg] = useState(null)

  useEffect(()=>{ 
    function load(){
      try{ const c = JSON.parse(localStorage.getItem('cart')||'[]'); setItems(c) }catch{ setItems([]) }
    }
    load()
  }, [])

  function save(next){
    localStorage.setItem('cart', JSON.stringify(next))
    setItems(next)
    if(onCartChange) onCartChange()
  }

  function changeQty(id, qty){
    const next = items.map(i=> i.id===id ? {...i, qty: Math.max(1, qty)} : i)
    save(next)
  }

  function removeItem(id){
    const next = items.filter(i=>i.id!==id)
    save(next)
  }

  function subtotal(){
    return items.reduce((s,i)=>s + (i.qty||1) * (parseFloat(i.price)||0), 0).toFixed(2)
  }

  function doCheckout(){
    const user = (()=>{ try{ return JSON.parse(localStorage.getItem('user')) }catch{return null} })()
    if(!user){ if(onRequireAuth) { onRequireAuth(); return } }
    // simulate checkout
    setMsg({type:'success', text:'Order placed (demo). Thank you!'})
    localStorage.removeItem('cart')
    setItems([])
    if(onCartChange) onCartChange()
  }

  return (
    <div style={{maxWidth:820}}>
      <h2>Your Cart</h2>
      <button className="btn btn-ghost" onClick={onBack} style={{marginBottom:12}}>Back</button>
      {items.length===0 ? (
        <div className="small">Your cart is empty.</div>
      ) : (
        <div>
          {items.map(it=> (
            <div key={it.id} style={{display:'flex',gap:12,alignItems:'center',marginBottom:12}}>
              <div style={{width:100,height:70,backgroundSize:'cover',backgroundPosition:'center',backgroundImage:`url(${it.img})`}} />
              <div style={{flex:1}}>
                <div style={{fontWeight:700}}>{it.title}</div>
                <div className="small">${it.price}</div>
                <div style={{marginTop:8}}>
                  <button className="btn btn-ghost" onClick={()=>changeQty(it.id, (it.qty||1)-1)}>-</button>
                  <span style={{margin:'0 8px'}}>{it.qty||1}</span>
                  <button className="btn btn-ghost" onClick={()=>changeQty(it.id, (it.qty||1)+1)}>+</button>
                  <button className="btn btn-ghost" onClick={()=>removeItem(it.id)} style={{marginLeft:12}}>Remove</button>
                </div>
              </div>
            </div>
          ))}

          <div style={{marginTop:18,fontWeight:700}}>Total: ${subtotal()}</div>
          <div style={{marginTop:12}}>
            <button className="btn btn-primary" onClick={doCheckout}>Checkout</button>
            <button className="btn btn-primary" onClick={() => { if(onPay) onPay(); }} style={{marginLeft:8}}>Pay</button>
          </div>
          {msg && <div className={"msg " + (msg.type==='error'? 'error':'success')} style={{marginTop:12}}>{msg.text}</div>}
        </div>
      )}
    </div>
  )
}
