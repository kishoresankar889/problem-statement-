import React, { useState, useEffect, useRef } from 'react'

export default function Admin({ onNavigate }){
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [img, setImg] = useState('')
  const [msg, setMsg] = useState(null)
  const [products, setProducts] = useState([])
  const [imgValid, setImgValid] = useState(null)
  const [fileUploading, setFileUploading] = useState(false)
  const [fileError, setFileError] = useState(null)
  const [orders, setOrders] = useState([])
  const [showOrdersPanel, setShowOrdersPanel] = useState(false)
  const prevUnnotifiedRef = useRef(0)
  const onNavigateRef = useRef(onNavigate)
  const [toast, setToast] = useState({ visible: false, count: 0 })

  useEffect(()=>{ onNavigateRef.current = onNavigate }, [onNavigate])

  useEffect(()=>{ load() }, [])

  useEffect(() => {
    // poll orders every 8 seconds when admin page is open
    let mounted = true
    async function poll(){
      try{
        const u = JSON.parse(localStorage.getItem('user')||'null');
        const headers = {}
        if(u && u.email) headers['x-admin-email'] = u.email
        const res = await fetch('http://localhost:3000/orders', { headers })
        if(!res.ok) return
        const data = await res.json()
        if(!mounted) return
        // detect newly arrived unnotified orders and alert once
        try{
          const unnotified = Array.isArray(data) ? data.filter(o=>o.notified===0).length : 0
          const prev = prevUnnotifiedRef.current || 0
          if(unnotified > prev){
            // new orders arrived — show non-blocking toast
            try{
              const diff = unnotified - prev
              setToast({ visible: true, count: diff })
            }catch(err){ console.debug('toast set failed', err) }
          }
          prevUnnotifiedRef.current = unnotified
        }catch(err){ console.debug('orders poll detect failed', err) }
        setOrders(data)
      } catch (err) { console.debug('orders poll failed', err) }
    }
    poll()
    const t = setInterval(poll, 8000)
    return ()=>{ mounted = false; clearInterval(t) }
  }, [])

  async function load(){
    try{
      const res = await fetch('http://localhost:3000/products')
      if (!res.ok) throw new Error('Failed to load products')
      const ct = (res.headers.get('content-type') || '').toLowerCase()
      let data
      if (ct.includes('application/json')) data = await res.json()
      else {
        const text = await res.text()
        throw new Error('Invalid products response: ' + (text.slice ? text.slice(0,200) : String(text)))
      }
      setProducts(data)
    }catch{
      setProducts([])
    }
  }

  async function handleAdd(e){
    e && e.preventDefault()
    setMsg(null)
    if(!title || !price) return setMsg({type:'error', text:'Title and price required'})
    if(!img) return setMsg({type:'error', text:'Image required. Please upload an image.'})
    if(imgValid === false) return setMsg({type:'error', text:'Uploaded image invalid. Please re-upload.'})
    try{
      // attach the current logged in user's email as admin proof
      let adminEmail = null
      try {
        const u = JSON.parse(localStorage.getItem('user')||'null');
        adminEmail = u && u.email;
      } catch {
        // ignore parse errors
      }
      const headers = {'Content-Type':'application/json'}
      if(adminEmail) headers['x-admin-email'] = adminEmail
      const res = await fetch('http://localhost:3000/products/add', {
        method: 'POST',
        headers,
        body: JSON.stringify({ title, price: parseFloat(price), img, adminEmail })
      })
      if(!res.ok){
        // try to get JSON error body, otherwise text
        const ct = (res.headers.get('content-type') || '').toLowerCase()
        let errMsg = 'Add failed'
        if (ct.includes('application/json')){
          const body = await res.json(); errMsg = body.error || body.message || errMsg
        } else {
          const txt = await res.text(); errMsg = txt.slice ? txt.slice(0,300) : String(txt)
        }
        throw new Error(errMsg)
      }
      await (res.headers.get('content-type') || '').toLowerCase().includes('application/json') ? res.json() : {}
      setMsg({type:'success', text:'Product added'})
      setTitle(''); setPrice(''); setImg('')
      load()
    }catch(err){
      setMsg({type:'error', text:err.message})
    }
  }

  async function handleDeleteProduct(id){
    if(!confirm('Delete this product?')) return;
    let adminEmail = null
    try{ const u = JSON.parse(localStorage.getItem('user')||'null'); adminEmail = u && u.email }catch{ /* Ignoring parse errors */ }
    try{
      const headers = {'Content-Type':'application/json'}
      if(adminEmail) headers['x-admin-email'] = adminEmail
      const res = await fetch(`http://localhost:3000/products/${id}`, { method: 'DELETE', headers });
      if(!res.ok) throw new Error('Delete failed')
      await load()
    }catch(err){ setMsg({type:'error', text:err.message}) }
  }

  async function markOrderNotified(id){
    try{
      const u = JSON.parse(localStorage.getItem('user')||'null');
      const headers = {'Content-Type':'application/json'}
      if(u && u.email) headers['x-admin-email'] = u.email
      const res = await fetch(`http://localhost:3000/orders/${id}/notify`, { method: 'PATCH', headers })
      if(!res.ok) throw new Error('Failed')
      // refresh orders
      const r2 = await fetch('http://localhost:3000/orders', { headers })
      if(r2.ok){ const d = await r2.json(); setOrders(d) }
    }catch(err){ console.error(err) }
  }

  function openOrdersFromToast(){
    setToast({ visible: false, count: 0 })
    try{ if(typeof onNavigateRef.current === 'function') onNavigateRef.current('orders') }catch(e){ console.error(e) }
  }

  function dismissToast(){ setToast({ visible: false, count: 0 }) }

  return (
    <div style={{maxWidth:820}}>
      {/* Non-blocking toast for new orders */}
      {toast.visible && (
        <div style={{position:'fixed',right:16,top:16,background:'#0a8f2f',color:'#fff',padding:12,borderRadius:8,boxShadow:'0 4px 12px rgba(0,0,0,0.12)',zIndex:200}}>
          <div style={{fontWeight:700}}>New order{toast.count>1?'s':''} received</div>
          <div style={{marginTop:8,display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button className="btn btn-ghost small" onClick={dismissToast}>Dismiss</button>
            <button className="btn btn-primary small" onClick={openOrdersFromToast}>Open Orders</button>
          </div>
        </div>
      )}
      <h2>Admin — Manage Products</h2>
      <form onSubmit={handleAdd} className="form" style={{marginBottom:16}}>
        <input className="input" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
        <input className="input" placeholder="Price" value={price} onChange={e=>setPrice(e.target.value)} />
        {/* Image URL removed — uploads only via file input */}
        <div style={{marginTop:8}}>
          <label className="small">Or upload an image file</label>
          <input type="file" accept="image/*" onChange={async (e)=>{
            const f = e.target.files && e.target.files[0];
            if(!f) return;
            setFileError(null);
            setFileUploading(true);
            try{
              // client-side resize to max width 1024 before uploading
              async function resizeImage(file, maxWidth){
                return new Promise((resolve, reject)=>{
                  const img = new Image();
                  img.onload = async () => {
                    const ratio = img.width / img.height;
                    const w = Math.min(maxWidth, img.width);
                    const h = Math.round(w / ratio);
                    const canvas = document.createElement('canvas');
                    canvas.width = w; canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    canvas.toBlob((blob) => {
                      if(!blob) return reject(new Error('Conversion failed'));
                      const newFile = new File([blob], file.name, { type: blob.type });
                      resolve(newFile);
                    }, 'image/jpeg', 0.85);
                  };
                  img.onerror = (e)=> reject(e || new Error('Image load error'));
                  // create object URL
                  img.src = URL.createObjectURL(file);
                })
              }

              const resized = await resizeImage(f, 1024);
              const fd = new FormData();
              fd.append('image', resized);
              // include admin email header in upload
              let adminEmail = null
              try{ const u = JSON.parse(localStorage.getItem('user')||'null'); adminEmail = u && u.email }catch{ /* ignore */ }
              const headers = {}
              if(adminEmail) headers['x-admin-email'] = adminEmail
              const res = await fetch('http://localhost:3000/upload', { method: 'POST', body: fd, headers });
              if(!res.ok) throw new Error('Upload failed');
              const body = await res.json();
              // returned url is like /uploads/filename
              const full = body.url && body.url.startsWith('http') ? body.url : `http://localhost:3000${body.url}`;
              setImg(full);
              setImgValid(true);
            }catch(err){
              console.error('Upload error', err);
              setFileError(err.message || String(err));
              setImg('');
              setImgValid(false);
            }finally{ setFileUploading(false) }
          }} />
          {fileUploading && <div className="small">Uploading image...</div>}
          {fileError && <div className="small" style={{color:'#b00020'}}>{fileError}</div>}
        </div>
        {/* Preview the entered image URL */}
        <div style={{marginTop:8, display:'flex', alignItems:'center', gap:12}}>
          {img ? (
            <div style={{width:120, height:80, border:'1px solid #ddd', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden'}}>
              <img src={img.startsWith('/') ? `http://localhost:3000${img}` : img} alt="preview" style={{width:'100%', height:'100%', objectFit:'cover'}} onError={(e)=>{ setImgValid(false); e.target.style.display='none' }} onLoad={()=>setImgValid(true)} />
            </div>
          ) : (
            <div style={{width:120, height:80, border:'1px dashed #ddd', display:'flex', alignItems:'center', justifyContent:'center', color:'#666'}}>Preview</div>
          )}
          <div style={{minWidth:120}}>
            {img ? (
              <div className="small" style={{color: imgValid===false ? '#b00020' : '#0a8f2f'}}>
                {imgValid === null ? 'Checking image...' : imgValid ? 'Image OK' : 'Image failed to load'}
              </div>
            ) : null}
          </div>
          <div className="small" style={{color:'#666'}}>Uploaded image will be used for the product.</div>
        </div>
        <div className="row">
          <button className="btn btn-primary" type="submit" disabled={fileUploading || imgValid===false || !img}>Add Product</button>
        </div>
      </form>
      {msg && <div className={"msg " + (msg.type==='error'?'error':'success')} style={{marginBottom:12}}>{msg.text}</div>}

      <h3>Existing Products</h3>
      <div style={{display:'flex',alignItems:'center',gap:12,marginTop:8}}>
        <button className="btn btn-ghost" onClick={()=>setShowOrdersPanel(!showOrdersPanel)}>Orders ({orders.filter(o=>o.notified===0).length} new)</button>
        <div className="small" style={{color:'#666'}}>Polls every 8s for new orders</div>
      </div>
      {showOrdersPanel && (
        <div style={{marginTop:12}}>
          <h3>Recent Orders</h3>
          {orders.length===0 && <div className="small">No orders yet</div>}
          {orders.map(o=> (
            <div key={o.id} style={{padding:12,marginBottom:8,background:'rgba(255,255,255,0.02)',borderRadius:8}}>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <div><strong>Order #{o.id}</strong> <span className="small" style={{color:'var(--muted)'}}>by {o.user_email || 'guest'}</span></div>
                <div className="small">{new Date(o.created_at).toLocaleString()}</div>
              </div>
              <div style={{marginTop:8}}>
                {o.items && o.items.map((it, idx) => (
                  <div key={idx} style={{display:'flex',justifyContent:'space-between'}}>
                    <div className="small">{it.title} x{it.qty||1}</div>
                    <div className="small">${((parseFloat(it.price)||0)*(it.qty||1)).toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:8,display:'flex',gap:8}}>
                <div className="small">Total: ${o.total}</div>
                {!o.notified && <button className="btn btn-primary small" onClick={()=>markOrderNotified(o.id)}>Mark notified</button>}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="products-grid" style={{marginTop:12}}>
        {products.map(p => (
          <article key={p.id} className="product-card">
            <div className="product-img" style={{backgroundImage:`url(${p.img || 'https://via.placeholder.com/640x420?text=No+Image'})`}} />
            <div style={{padding:12}}>
              <div style={{fontWeight:700}}>{p.title}</div>
              <div className="small">${p.price}</div>
              <div style={{marginTop:8}}>
                <button className="btn btn-ghost small" onClick={()=>{ setTitle(p.title); setPrice(p.price); setImg(p.img || '') }}>Edit</button>
                <button className="btn btn-ghost small" style={{marginLeft:8}} onClick={()=>handleDeleteProduct(p.id)}>Delete</button>
              </div>
            </div>
          </article>
        ))}
        {products.length === 0 && <div className="small">No products yet</div>}
      </div>
    </div>
  )
}
