const API_BASE = 'http://localhost:8080/api';
let cart = [];
let total = 0;
let token = null;
let authMode = 'login';

// Cargar productos al iniciar
async function loadProducts() {
  try {
    const res = await fetch(API_BASE + '/products');
    const products = await res.json();
    renderProducts(products);
  } catch (e) {
    console.error('Error cargando productos', e);
    
    // Productos de respaldo si no hay backend
    const fallback = [
      {id:1, name:'Arroz', description:'Arroz superior 1kg', price:3.5, image:'https://via.placeholder.com/300x200/4caf50/ffffff?text=Arroz'},
      {id:2, name:'Aceite', description:'Aceite vegetal 1L', price:8.9, image:'https://via.placeholder.com/300x200/66bb6a/ffffff?text=Aceite'},
      {id:3, name:'Azúcar', description:'Azúcar blanca 1kg', price:2.8, image:'https://via.placeholder.com/300x200/81c784/ffffff?text=Azucar'},
      {id:4, name:'Leche', description:'Leche evaporada', price:4.2, image:'https://via.placeholder.com/300x200/4caf50/ffffff?text=Leche'},
      {id:5, name:'Pan', description:'Pan francés', price:0.3, image:'https://via.placeholder.com/300x200/66bb6a/ffffff?text=Pan'},
      {id:6, name:'Cuaderno', description:'Cuaderno 100 hojas', price:5.5, image:'https://via.placeholder.com/300x200/81c784/ffffff?text=Cuaderno'},
      {id:7, name:'Lapiceros', description:'Pack de 3 lapiceros', price:2.0, image:'https://via.placeholder.com/300x200/4caf50/ffffff?text=Lapiceros'},
      {id:8, name:'Golosinas', description:'Caramelos variados', price:2.5, image:'https://via.placeholder.com/300x200/66bb6a/ffffff?text=Golosinas'}
    ];
    
    renderProducts(fallback);
  }
}

function renderProducts(products) {
  const grid = document.getElementById('productos-grid');
  const zone = document.getElementById('zona-grid');
  grid.innerHTML = '';
  zone.innerHTML = '';

  products.forEach(p => {
    const card = createProductCard(p);
    const cardClone = createProductCard(p);
    grid.appendChild(card);
    zone.appendChild(cardClone);
  });
}

function createProductCard(p) {
  const div = document.createElement('div');
  div.className = 'producto';
  div.innerHTML = `
    <img src="${p.image || 'https://via.placeholder.com/300x200/4caf50/ffffff?text=Producto'}" alt="${p.name}" />
    <h3>${p.name}</h3>
    <p>${p.description || ''}</p>
    <p><strong>S/ ${Number(p.price).toFixed(2)}</strong></p>
    <button class="btn" onclick='addToCart(${JSON.stringify(p).replace(/'/g, "&apos;")})'>Agregar al carrito</button>
  `;
  return div;
}

function addToCart(p) {
  const existing = cart.find(item => item.id === p.id);
  
  if (existing) {
    existing.cantidad++;
  } else {
    cart.push({...p, cantidad: 1});
  }
  
  updateCartDisplay();
}

function updateCartDisplay() {
  const lista = document.getElementById('carrito-lista');
  lista.innerHTML = '';
  
  if (cart.length === 0) {
    lista.innerHTML = '<div class="empty-cart">El carrito está vacío</div>';
  } else {
    cart.forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="carrito-item-info">
          <strong>${item.name}</strong><br>
          <small>S/ ${Number(item.price).toFixed(2)} c/u</small>
        </div>
        <div class="carrito-item-actions">
          <div class="cantidad-control">
            <button onclick="updateQuantity(${item.id}, ${item.cantidad - 1})">-</button>
            <span style="min-width:20px; text-align:center; font-weight:bold;">${item.cantidad}</span>
            <button onclick="updateQuantity(${item.id}, ${item.cantidad + 1})">+</button>
          </div>
          <strong style="color:#2e7d32; min-width:80px; text-align:right;">S/ ${(item.price * item.cantidad).toFixed(2)}</strong>
          <button class="btn red" onclick="removeFromCart(${item.id})" style="padding:5px 10px;">✕</button>
        </div>
      `;
      lista.appendChild(li);
    });
  }

  total = cart.reduce((sum, item) => sum + (item.price * item.cantidad), 0);
  document.getElementById('carrito-total').textContent = total.toFixed(2);
}

function updateQuantity(id, newQuantity) {
  if (newQuantity <= 0) {
    removeFromCart(id);
  } else {
    const item = cart.find(c => c.id === id);
    if (item) {
      item.cantidad = newQuantity;
      updateCartDisplay();
    }
  }
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  updateCartDisplay();
}

// Checkout
async function checkout() {
  if (!token) {
    alert('Debes ingresar para procesar el pago.');
    openLogin();
    return;
  }

  if (cart.length === 0) {
    alert('El carrito está vacío');
    return;
  }

  const items = cart.map(c => ({
    nombre: c.name,
    precio: c.price,
    cantidad: c.cantidad,
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
      alert(`¡Pedido procesado correctamente! Total: S/ ${total.toFixed(2)}`);
      cart = [];
      updateCartDisplay();
    } else {
      const err = await res.json();
      alert('Error: ' + (err.message || res.statusText));
    }
  } catch (e) {
    console.error(e);
    alert(`Compra simulada exitosa. Total: S/ ${total.toFixed(2)}\n(No se pudo conectar al backend)`);
    cart = [];
    updateCartDisplay();
  }
}

// Modal de autenticación
function openLogin() {
  document.getElementById('modal').style.display = 'flex';
  document.getElementById('modal-title').innerText = 'Ingresar';
  document.getElementById('modal-action').innerText = 'Entrar';
  authMode = 'login';
}

function closeLogin() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('email').value = '';
  document.getElementById('password').value = '';
}

function toggleMode() {
  authMode = authMode === 'login' ? 'register' : 'login';
  document.getElementById('modal-title').innerText = authMode === 'login' ? 'Ingresar' : 'Registrarse';
  document.getElementById('modal-action').innerText = authMode === 'login' ? 'Entrar' : 'Crear cuenta';
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
      alert('¡Bienvenido!');
      closeLogin();
    } else {
      alert('Registro correcto. Ingresa para continuar.');
      toggleMode();
    }
  } catch (e) {
    console.error(e);
    // Modo demo sin backend
    token = 'demo-token';
    document.getElementById('user-email').innerText = email;
    document.getElementById('btn-login').style.display = 'none';
    document.getElementById('btn-logout').style.display = 'inline-block';
    alert('¡Bienvenido! (Modo demo sin backend)');
    closeLogin();
  }
}

function logout() {
  token = null;
  document.getElementById('user-email').innerText = 'Invitado';
  document.getElementById('btn-login').style.display = 'inline-block';
  document.getElementById('btn-logout').style.display = 'none';
  cart = [];
  updateCartDisplay();
  alert('Sesión cerrada');
}

// Inicializar la aplicación
loadProducts();