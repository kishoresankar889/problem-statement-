import React, {useState} from 'react'

export default function Login({ onSuccess }){
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [msg, setMsg] = useState(null)
	const [loading, setLoading] = useState(false)

	async function handleSubmit(e){
		e.preventDefault()
		setMsg(null)
		setLoading(true)
		try{
			const res = await fetch('http://localhost:3000/auth/login', {
				method: 'POST',
				headers: {'Content-Type':'application/json'},
				body: JSON.stringify({email, password})
			})
			const data = await res.json()
			if(!res.ok) throw new Error(data.error || data.message || 'Login failed')
			setMsg({type:'success', text: data.message || 'Logged in'})
			if(data.user) {
				localStorage.setItem('user', JSON.stringify(data.user))
			}
			// navigate to home if parent provides handler
			if (onSuccess) onSuccess()
		}catch(err){
			setMsg({type:'error', text: err.message})
		}finally{ setLoading(false) }
	}

	return (
		<div style={{maxWidth:420}}>
			<h2>Sign in</h2>
			<form onSubmit={handleSubmit} className="form">
				<input className="input" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
				<input className="input" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
				<div className="row">
					<button className="btn btn-primary" type="submit" disabled={loading}>{loading? 'Signing...' : 'Sign in'}</button>
				</div>
			</form>
			{msg && (
				<div className={"msg " + (msg.type === 'error' ? 'error' : 'success')} style={{marginTop:12}}>{msg.text}</div>
			)}
		</div>
	)
}
