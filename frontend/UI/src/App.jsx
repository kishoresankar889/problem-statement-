
import React, { useState, useEffect } from 'react'
import './App.css'
import Signup from './pages/signup'
import Login from './pages/login'
import Home from './pages/home'
import Admin from './pages/admin'
import Orders from './pages/orders'
import Cart from './pages/cart'
import Pay from './pages/pay'
import Product from './pages/product'


export default function App(){
	const getInitialView = () => 'home'

	const [view, setView] = useState(getInitialView) // 'login' or 'signup' or 'home'
	const [user, setUser] = useState(() => {
		try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
	})
	const [cartCount, setCartCount] = useState(()=>{
		try{ const c = JSON.parse(localStorage.getItem('cart')||'[]'); return c.reduce((s,i)=>s+(i.qty||1),0) }catch{return 0}
	})
	const [selectedProduct, setSelectedProduct] = useState(null)

	// keep user state in sync with localStorage on mount
	useEffect(() => {
		const fetchUser = () => {
			try {
				const u = JSON.parse(localStorage.getItem('user'));
				setUser(u);
			} catch {
				setUser(null);
			}
		};
		fetchUser();
	}, []);

	// logout handler
	function handleLogout(){
		try { localStorage.removeItem('user') } catch { /* Ignored */ }
		setUser(null)
		setView('login')
	}

	// called after successful login to refresh user state and go to home
	function handleLoginSuccess(){
		try{ const u = JSON.parse(localStorage.getItem('user')); setUser(u) }catch{ setUser(null) }
		setView('home')
	}

	function refreshCartCount(){
		try{ const c = JSON.parse(localStorage.getItem('cart')||'[]'); setCartCount(c.reduce((s,i)=>s+(i.qty||1),0)) }catch{setCartCount(0)}
	}

	return (
		<div style={{fontFamily:'system-ui, Arial',maxWidth:720,margin:'32px auto',padding:16}}>
			<header style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
				<h1 style={{margin:0}}>Jagan Industries</h1>
				<nav style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8}}>
					{!user && (
						<>
							<button className="btn btn-ghost" onClick={() => setView('signup')} style={{marginRight:8}}>Sign up</button>
							<button className="btn btn-ghost" onClick={() => setView('login')}>Login</button>
						</>
					)}
					{user && String(user.email).toLowerCase() === 'kishore@gmail.com' && (
						<>
							<button className="btn btn-ghost" onClick={() => setView('admin')} style={{marginLeft:8}}>Admin</button>
							<button className="btn btn-ghost" onClick={() => setView('orders')} style={{marginLeft:8}}>Orders</button>
						</>
					)}
					<button className="btn btn-ghost" onClick={() => setView('cart')} style={{marginLeft:8}}>Cart ({cartCount})</button>
					{user && (
						<>
							<div className="small" style={{marginRight:12}}>{user.email}</div>
							<button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
						</>
					)}
				</nav>
			</header>

			<main>
				{view === 'signup'
					? <Signup />
					: view === 'login'
						? <Login onSuccess={handleLoginSuccess} />
						    : view === 'admin'
							    ? <Admin onNavigate={(v)=>setView(v)} />
							    : view === 'orders'
								? <Orders onBack={() => setView('admin')} />
							: view === 'cart'
								? <Cart onRequireAuth={() => setView('login')} onBack={() => setView('home')} onCartChange={refreshCartCount} onPay={() => setView('pay')} />
								: view === 'pay'
									? <Pay onBack={() => setView('cart')} />
									: view === 'product' && selectedProduct
									? <Product product={selectedProduct} onBack={() => setView('home')} onCartChange={refreshCartCount} />
									: <Home onLogout={handleLogout} onRequireAuth={() => setView('login')} onViewProduct={(p)=>{ setSelectedProduct(p); setView('product') }} onCartChange={refreshCartCount} />}
			</main>
		</div>
	)
}
