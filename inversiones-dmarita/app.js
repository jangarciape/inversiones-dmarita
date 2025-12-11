const API_BASE = 'http://localhost:8080/api';
let cart = [];
let total = 0;
let token = null;
let authMode = 'login';

// Cargar productos
async function loadProducts() {
  try {
    const res = await fetch(API_BASE + '/products');
    const products = await res.json();
    const grid = document.getElementById('productos-grid');
    const zone = document.getElementById('zona-grid');
    grid.innerHTML = '';
    zone.innerHTML = '';

    products.forEach(p => {
      const card = createProductCard(p);
      grid.appendChild(card);
      zone.appendChild(createProductCard(p));
    });
  } catch (e) {
    console.error('Error cargando productos', e);

    const fallback = [
      {id:1,name:'Golosinas',description:'Caramelos, chicles, chocolates.',price:2.5,image:'golosinas.jpg'},
      {id:2,name:'Bebidas Energéticas',description:'Variedad de marcas',price:8.0,image:'bebidas.jpg'},
      {id:3,name:'Artículos de Oficina',description:'Resmas, lapiceros',price:10.0,image:'oficina.jpg'}
    ];

    fallback.forEach(p => {
      document.getElementById('productos-grid').appendChild(createProductCard(p));
      document.getElementById('zona-grid').appendChild(createProductCard(p));
    });
  }
}

function createProductCard(p) {
  const div = document.createElement('div');
  div.className = 'producto';
  div.innerHTML = `
    <img src="${p.image || 'store.jpg'}" alt="${p.name}" />
    <h3>${p.name}</h3>
    <p>${p.description}</p>
    <p><strong>Precio: S/ ${Number(p.price).toFixed(2)}</strong></p>
    <button class="btn" onclick='addToCart(${JSON.stringify(p)})'>Agregar al carrito</button>
  `;
  return div;
}

function addToCart(p) {
  cart.push(p);
  const li = document.createElement('li');
  li.textContent = `${p.name} - S/ ${Number(p.price).toFixed(2)}`;
  document.getElementById('carrito-lista').appendChild(li);

  total += Number(p.price);
  document.getElementById('carrito-total').textContent = total.toFixed(2);
}

// Checkout
async function checkout() {
  if (!token) {
    alert('Debes ingresar para procesar el pago.');
    openLogin();
    return;
  }

  const items = cart.map(c => ({
    nombre: c.name,
    precio: c.price,
    cantidad: 1,
    productId: c.id
  }));

  try {
    const res = await fetch(API_BASE + '/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({items})
    });

    if (res.ok) {
      alert('Pedido procesado correctamente.');
      cart = []; total = 0;
      document.getElementById('carrito-lista').innerHTML = '';
      document.getElementById('carrito-total').textContent = '0.00';
    } else {
      const err = await res.json();
      alert('Error: ' + (err.message || res.statusText));
    }
  } catch (e) {
    console.error(e);
    alert('No se pudo conectar al backend.');
  }
}

// Modal
function openLogin() {
  document.getElementById('modal').style.display = 'flex';
  document.getElementById('modal-title').innerText = 'Ingresar';
  authMode = 'login';
}

function closeLogin() {
  document.getElementById('modal').style.display = 'none';
}

function toggleMode() {
  authMode = authMode === 'login' ? 'register' : 'login';
  document.getElementById('modal-title').innerText =
    authMode === 'login' ? 'Ingresar' : 'Registrarse';
  document.getElementById('modal-action').innerText =
    authMode === 'login' ? 'Entrar' : 'Crear';
}

async function auth() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  if (!email || !password) {
    alert('Completa email y contraseña');
    return;
  }

  const path = authMode === 'login' ? '/auth/login' : '/auth/register';

  try {
    const res = await fetch(API_BASE + path, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email, password})
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || 'Error');
      return;
    }

    if (data.token) {
      token = data.token;
      document.getElementById('user-email').innerText = data.email || email;
      document.getElementById('btn-login').style.display = 'none';
      document.getElementById('btn-logout').style.display = 'inline-block';
      closeLogin();
    } else {
      alert('Registro correcto. Ingresa para continuar.');
      toggleMode();
    }
  } catch (e) {
    console.error(e);
    alert('Error de conexión.');
  }
}

function logout() {
  token = null;
  document.getElementById('user-email').innerText = 'Invitado';
  document.getElementById('btn-login').style.display = 'inline-block';
  document.getElementById('btn-logout').style.display = 'none';
}

// Inicializar
loadProducts();
