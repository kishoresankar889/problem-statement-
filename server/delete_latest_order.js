(async ()=>{
  try{
    const adminHeader = { 'x-admin-email': 'kishore@gmail.com' }
    const listRes = await fetch('http://localhost:3000/orders', { headers: adminHeader })
    if(!listRes.ok){ const t = await listRes.text(); console.error('Failed to list orders', listRes.status, t); process.exit(1) }
    const orders = await listRes.json()
    if(!orders || orders.length === 0){ console.log('No orders to delete'); process.exit(0) }
    const id = orders[0].id
    console.log('Deleting order id', id)
    const delRes = await fetch(`http://localhost:3000/orders/${id}`, { method: 'DELETE', headers: adminHeader })
    const delText = await delRes.text()
    console.log('DELETE status', delRes.status, delText)
    // list again
    const after = await (await fetch('http://localhost:3000/orders', { headers: adminHeader })).json()
    console.log('Orders now, top 3:', JSON.stringify(after.slice(0,3), null, 2))
  }catch(err){ console.error('Error', err); process.exit(1) }
})();
