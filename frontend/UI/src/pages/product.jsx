import React from 'react'

export default function Product({ product, onBack, onCartChange }){
  if(!product) return null

  function addToCart(){
    try{
      const cart = JSON.parse(localStorage.getItem('cart')||'[]')
      const existing = cart.find(i=>i.id===product.id)
      if(existing){ existing.qty = (existing.qty||1) + 1 }
      else { cart.push({ id: product.id, title: product.title, price: product.price, img: product.img, qty: 1 }) }
      localStorage.setItem('cart', JSON.stringify(cart))
      if(onCartChange) onCartChange()
      alert('Added to cart')
    }catch(e){ console.error(e); alert('Could not add to cart') }
  }

  return (
    <div style={{maxWidth:820}}>
      <button className="btn btn-ghost" onClick={onBack} style={{marginBottom:12}}>Back</button>
      <div style={{display:'flex',gap:16}}>
        <div style={{width:420,height:300,backgroundImage:`url(${product.img})`,backgroundSize:'cover',backgroundPosition:'center',borderRadius:8}} />
        <div style={{flex:1}}>
          <h2 style={{marginTop:0}}>{product.title}</h2>
          <div className="small">${product.price}</div>
          <p className="small" style={{marginTop:12}}>This is a sample product description. Replace with real description from the server if available.</p>
          <div style={{marginTop:16}}>
            <button className="btn btn-primary" onClick={addToCart}>Add to cart</button>
          </div>
        </div>
      </div>
    </div>
  )
}
