(async ()=>{
  try{
    const postRes = await fetch('http://localhost:3000/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail: 'customer@example.com', items: [{ title: 'TEST PRODUCT', price: 9.99, qty: 2 }], total: 19.98 })
    });
    const postBody = await postRes.text();
    console.log('POST /orders response status', postRes.status);
    console.log(postBody);

    const getRes = await fetch('http://localhost:3000/orders', { headers: { 'x-admin-email': 'kishore@gmail.com' } });
    const data = await getRes.json();
    console.log('\nGET /orders (as admin) status', getRes.status);
    console.log(JSON.stringify(data, null, 2));
  }catch(err){
    console.error('Error in test script', err);
    process.exit(1);
  }
})();
