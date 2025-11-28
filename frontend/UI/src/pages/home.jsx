import React, { useState, useEffect } from 'react'

const FALLBACK = [
    { id: 1, title: 'Modern Oak Coffee Table', price: 129, img: 'https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcSD24FINNvGY3YA6Iy9yWyyUpolMh9VwQEsJGjH3G62gJjARNIbupXm5VEDzHSj1_qWwF90p6EonC6ByjsfVcN7h18yUB_1tXzjmHEKS0Bym71AItNS0iYXsg&usqp=CAc' },
    { id: 2, title: 'Scandi Lounge Chair', price: 249, img: 'https://via.placeholder.com/640x420?text=Lounge+Chair' },
    { id: 3, title: 'Minimalist TV Unit', price: 399, img: 'https://via.placeholder.com/640x420?text=TV+Unit' }
]

export default function Home({ onLogout, onRequireAuth, onCartChange, onViewProduct }){
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load(){
                try{
                    const res = await fetch('http://localhost:3000/products')
                    if (!res.ok) throw new Error('Failed to load')
                    const ct = (res.headers.get('content-type') || '').toLowerCase()
                    let data
                    if (ct.includes('application/json')) {
                        data = await res.json()
                    } else {
                        const text = await res.text()
                        throw new Error('Server returned non-JSON response: ' + (text.slice ? text.slice(0,200) : String(text)))
                    }
                    setProducts(data)
                }catch(e){
                    console.error('Products load failed:', e)
                    setProducts(FALLBACK)
                }finally{setLoading(false)}
            }
        load()
    }, [])
    let user = null
    try{ user = JSON.parse(localStorage.getItem('user')) }catch{ user = null }

    function addToCart(p){
        if(!user){
            if(onRequireAuth) onRequireAuth()
            return
        }
        try{
            const cart = JSON.parse(localStorage.getItem('cart')||'[]')
            const existing = cart.find(i=>i.id===p.id)
            if(existing) existing.qty = (existing.qty||1) + 1
            else cart.push({ id: p.id, title: p.title, price: p.price, img: p.img, qty: 1 })
            localStorage.setItem('cart', JSON.stringify(cart))
            if(onCartChange) onCartChange()
            alert(`${p.title} added to cart`)
        }catch(e){
            console.error(e)
            alert('Could not add to cart')
        }
    }

    function viewProduct(p){
        if(!user){
            if(onRequireAuth) onRequireAuth()
            return
        }
        if(onViewProduct) return onViewProduct(p)
        alert(`Viewing details for ${p.title}`)
    }

    function scrollToProducts(){
        const el = document.getElementById('products')
        if(el) el.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <div>
            <section className="card" style={{alignItems:'center',gap:20}}>
                <div className="brand">
                    <h1>Jagan Industries</h1>
                    <p>Quality furniture and home solutions from Jagan Industries.</p>
                    {user ? (
                        <div style={{marginTop:12}}>
                            <div style={{fontSize:14,fontWeight:700}}>{user.email}</div>
                            <div className="small">Member since: {user.created_at ? user.created_at.split('T')[0] : '—'}</div>
                        </div>
                    ) : (
                        <div className="small" style={{marginTop:12}}>Sign up or login to save favorites.</div>
                    )}
                </div>

                <div className="form-area">
                    <h2 style={{marginTop:0}}>Modern furniture for every room</h2>
                    <p className="small">Discover comfortable, stylish and affordable furniture handpicked for you.</p>
                    <div style={{marginTop:12, display:'flex', gap:8}}>
                        <button className="btn btn-primary" onClick={scrollToProducts}>Shop Now</button>
                        <button className="btn btn-ghost" onClick={() => alert('Visit showroom: JAGAN INDUSTRIES MOBILE:9444511114')}>Visit Showroom</button>
                        {user && <button style={{marginLeft:'auto'}} className="btn btn-ghost" onClick={() => { localStorage.removeItem('user'); onLogout && onLogout(); }}>Logout</button>}
                    </div>
                </div>
            </section>

            <section id="products" style={{padding:'28px 8px'}}>
                <h3 style={{marginTop:16}}>Featured</h3>
                <div className="products-grid" style={{marginTop:12}}>
                    {loading ? (
                        <div className="small">Loading products...</div>
                    ) : (
                        products.map(p => (
                        <article key={p.id} className="product-card">
                            <div className="product-img" style={{backgroundImage:`url(${p.img})`}} />
                            <div style={{padding:12}}>
                                <div style={{fontWeight:700}}>{p.title}</div>
                                <div className="small" style={{marginTop:6}}>Starting from</div>
                                <div style={{marginTop:6, fontSize:18, fontWeight:700}}>${p.price}</div>
                                <div style={{marginTop:10}}>
                                      <button className="btn btn-primary" onClick={()=>addToCart(p)}>Add to cart</button>
                                      <button className="btn btn-ghost" style={{marginLeft:8}} onClick={()=>viewProduct(p)}>View</button>
                                </div>
                            </div>
                        </article>
                    ))
                    )}
                </div>
            </section>
        </div>
    )
}
