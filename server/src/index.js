const bcrypt = require('bcryptjs')
const cors = require('cors')
const crypto = require('node:crypto')
const dotenv = require('dotenv')
const express = require('express')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const Stripe = require('stripe')
const Product = require('./models/Product')
const User = require('./models/User')

dotenv.config()

const app = express()
const port = process.env.PORT || 5000
const jwtSecret = process.env.JWT_SECRET
const stripeKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeKey && /^(sk_test_|sk_live_)/.test(stripeKey) ? new Stripe(stripeKey) : null
const shippingCountries = [
  'CA', 'MX', 'US', 'AG', 'AI', 'AW', 'BB', 'BL', 'BM', 'BQ', 'BS', 'BZ', 'CR', 'CW', 'DM', 'DO', 'GD', 'GL', 'GP', 'GT', 'HN', 'HT', 'JM', 'KN', 'KY', 'LC', 'MF', 'MQ', 'MS', 'NI', 'PA', 'PM', 'PR', 'SV', 'SX', 'TC', 'TT', 'VC', 'VG',
  'AR', 'BO', 'BR', 'BV', 'CL', 'CO', 'EC', 'FK', 'GF', 'GS', 'GY', 'PE', 'PY', 'SR', 'UY', 'VE',
  'AD', 'AL', 'AT', 'AX', 'BA', 'BE', 'BG', 'BY', 'CH', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FO', 'FR', 'GB', 'GG', 'GI', 'GR', 'HR', 'HU', 'IE', 'IM', 'IS', 'IT', 'JE', 'LI', 'LT', 'LU', 'LV', 'MC', 'MD', 'ME', 'MK', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'RS', 'RU', 'SE', 'SI', 'SJ', 'SK', 'SM', 'UA', 'VA',
  'AO', 'BF', 'BI', 'BJ', 'BW', 'CD', 'CF', 'CG', 'CI', 'CM', 'CV', 'DJ', 'DZ', 'EG', 'ER', 'ET', 'GA', 'GH', 'GM', 'GN', 'GQ', 'GW', 'IO', 'KE', 'KM', 'LR', 'LS', 'LY', 'MA', 'MG', 'ML', 'MR', 'MU', 'MW', 'MZ', 'NA', 'NE', 'NG', 'RE', 'RW', 'SC', 'SH', 'SL', 'SN', 'SO', 'SS', 'ST', 'SZ', 'TD', 'TF', 'TG', 'TN', 'TZ', 'UG', 'YT', 'ZA', 'ZM', 'ZW',
  'AE', 'AF', 'AM', 'AZ', 'BD', 'BH', 'BN', 'BT', 'CN', 'CY', 'GE', 'HK', 'ID', 'IL', 'IN', 'IQ', 'JO', 'JP', 'KG', 'KH', 'KR', 'KW', 'KZ', 'LA', 'LB', 'LK', 'MM', 'MN', 'MO', 'MV', 'MY', 'NP', 'OM', 'PH', 'PK', 'QA', 'SA', 'SG', 'TH', 'TJ', 'TL', 'TM', 'TR', 'TW', 'UZ', 'VN', 'YE',
  'AU', 'CK', 'FJ', 'GU', 'KI', 'NC', 'NR', 'NU', 'NZ', 'PF', 'PG', 'PN', 'SB', 'TK', 'TO', 'TV', 'VU', 'WF', 'WS',
]

const catalog = new Map([
  [1, { name: 'The relaxed blazer', price: 16800, image: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=900&q=85' }],
  [2, { name: 'Studio knit cardigan', price: 9400, image: 'https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?auto=format&fit=crop&w=900&q=85' }],
  [3, { name: 'Wide-leg trouser', price: 11200, image: 'https://images.unsplash.com/photo-1506629905607-d9c297d8a0d1?auto=format&fit=crop&w=900&q=85' }],
  [4, { name: 'Sunday cotton shirt', price: 7800, image: 'https://images.unsplash.com/photo-1605763240000-7e93b172d754?auto=format&fit=crop&w=900&q=85' }],
  [5, { name: 'Bias-cut slip dress', price: 13600, image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=85' }],
  [6, { name: 'Everyday leather tote', price: 18500, image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=85' }],
  [7, { name: 'Merino fine scarf', price: 6200, image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=900&q=85' }],
  [8, { name: 'Canvas utility overshirt', price: 10500, image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=85' }],
  [9, { name: 'Soft jersey tank', price: 4200, image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=85' }],
])

app.use(cors())
app.use(express.json())

app.get('/api/health', (request, response) => {
  response.json({ status: 'ok', service: 'online-store-api' })
})

app.get('/api/products', async (request, response) => {
  if (!requireDatabase(response)) return
  try {
    const products = await Product.find({ active: true }).sort({ createdAt: -1 }).lean()
    response.json(products)
  } catch (error) {
    response.status(500).json({ message: 'Unable to load products.' })
  }
})

app.post('/api/payments/create-checkout-session', async (request, response) => {
  if (!stripe) return response.status(503).json({ message: 'Stripe is not configured. Add STRIPE_SECRET_KEY to server/.env.' })

  const items = Array.isArray(request.body.items) ? request.body.items : []
  if (!items.length) return response.status(400).json({ message: 'Your bag is empty.' })

  const lineItems = []
  for (const item of items) {
    const product = catalog.get(Number(item.id))
    const quantity = Math.max(1, Math.min(20, Number(item.quantity) || 1))
    if (!product) return response.status(400).json({ message: 'One of the products in your bag is no longer available.' })
    const options = [item.color && `Color: ${String(item.color).slice(0, 40)}`, item.size && `Size: ${String(item.size).slice(0, 20)}`].filter(Boolean).join(' / ')
    lineItems.push({ price_data: { currency: 'usd', product_data: { name: options ? `${product.name} (${options})` : product.name, images: [product.image] }, unit_amount: product.price }, quantity })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      ui_mode: 'hosted_page',
      line_items: lineItems,
      success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/?checkout=success`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/?checkout=cancelled`,
      billing_address_collection: 'auto',
      name_collection: {
        individual: { enabled: true, optional: true },
        business: { enabled: true, optional: true },
      },
      phone_number_collection: { enabled: true },
      allow_promotion_codes: true,
      submit_type: 'auto',
      shipping_address_collection: { allowed_countries: shippingCountries },
      integration_identifier: 'hosted_web_0001',
      origin_context: 'web',
    })
    response.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout session failed:', error.message)
    response.status(500).json({ message: 'Unable to start checkout right now.' })
  }
})

function createToken(user) {
  return jwt.sign({ userId: user._id.toString() }, jwtSecret, { expiresIn: '7d' })
}

function requireDatabase(response) {
  if (mongoose.connection.readyState !== 1) {
    response.status(503).json({ message: 'Database is not connected. Set MONGO_URI and restart the server.' })
    return false
  }

  return true
}

function authenticate(request, response, next) {
  const token = request.headers.authorization?.replace('Bearer ', '')
  if (!token || !jwtSecret) return response.status(401).json({ message: 'Authentication required.' })

  try {
    const payload = jwt.verify(token, jwtSecret)
    request.userId = payload.userId
    next()
  } catch (error) {
    response.status(401).json({ message: 'Your session has expired.' })
  }
}

async function seedProducts() {
  if (await Product.exists({})) return
  const seed = [...catalog.entries()].map(([id, product]) => ({
    name: product.name,
    category: 'Clothing',
    price: product.price / 100,
    image: product.image,
    colors: [],
    sizes: [],
    stock: 10,
    active: true,
    legacyId: id,
  }))
  await Product.insertMany(seed)
  console.log(`Seeded ${seed.length} products`)
}

async function requireOwner(request, response, next) {
  authenticate(request, response, async () => {
    try {
      const user = await User.findById(request.userId).select('role email')
      const isConfiguredOwner = process.env.OWNER_EMAIL && user?.email === process.env.OWNER_EMAIL.toLowerCase()
      if (!user || (user.role !== 'owner' && !isConfiguredOwner)) return response.status(403).json({ message: 'Store owner access required.' })
      next()
    } catch (error) {
      response.status(500).json({ message: 'Unable to verify owner access.' })
    }
  })
}

app.post('/api/products', requireOwner, async (request, response) => {
  const { name, description, category, price, image, colors, sizes, stock, active } = request.body
  if (!name?.trim() || !category?.trim() || !image?.trim() || price === undefined || stock === undefined) return response.status(400).json({ message: 'Name, category, price, image, and stock are required.' })
  try {
    const product = await Product.create({ name: name.trim(), description, category: category.trim(), price: Number(price), image: image.trim(), colors: colors || [], sizes: sizes || [], stock: Number(stock), active: active !== false })
    response.status(201).json(product)
  } catch (error) {
    response.status(400).json({ message: 'Product data is invalid.' })
  }
})

app.patch('/api/products/:productId', requireOwner, async (request, response) => {
  try {
    const product = await Product.findByIdAndUpdate(request.params.productId, request.body, { new: true, runValidators: true })
    if (!product) return response.status(404).json({ message: 'Product not found.' })
    response.json(product)
  } catch (error) {
    response.status(400).json({ message: 'Product update is invalid.' })
  }
})

app.delete('/api/products/:productId', requireOwner, async (request, response) => {
  try {
    const product = await Product.findByIdAndUpdate(request.params.productId, { active: false }, { new: true })
    if (!product) return response.status(404).json({ message: 'Product not found.' })
    response.json({ message: 'Product hidden from the storefront.' })
  } catch (error) {
    response.status(500).json({ message: 'Unable to remove product.' })
  }
})

app.post('/api/auth/signup', async (request, response) => {
  const { name, email, password } = request.body

  if (!requireDatabase(response)) return
  if (!jwtSecret) return response.status(503).json({ message: 'JWT_SECRET is not configured.' })
  if (!name?.trim() || !email?.trim() || !password) return response.status(400).json({ message: 'Name, email, and password are required.' })
  if (password.length < 8) return response.status(400).json({ message: 'Password must be at least 8 characters.' })

  try {
    const normalizedEmail = email.trim().toLowerCase()
    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) return response.status(409).json({ message: 'An account with that email already exists.' })

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({ name: name.trim(), email: normalizedEmail, password: passwordHash })
    response.status(201).json({ token: createToken(user), user: { id: user._id, name: user.name, email: user.email, addresses: user.addresses } })
  } catch (error) {
    response.status(500).json({ message: 'Unable to create your account right now.' })
  }
})

app.post('/api/auth/login', async (request, response) => {
  const { email, password } = request.body

  if (!requireDatabase(response)) return
  if (!jwtSecret) return response.status(503).json({ message: 'JWT_SECRET is not configured.' })
  if (!email?.trim() || !password) return response.status(400).json({ message: 'Email and password are required.' })

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password')
    const passwordMatches = user && await bcrypt.compare(password, user.password)
    if (!passwordMatches) return response.status(401).json({ message: 'Email or password is incorrect.' })

    response.json({ token: createToken(user), user: { id: user._id, name: user.name, email: user.email, addresses: user.addresses } })
  } catch (error) {
    response.status(500).json({ message: 'Unable to sign you in right now.' })
  }
})

app.get('/api/auth/me', async (request, response) => {
  const token = request.headers.authorization?.replace('Bearer ', '')
  if (!token || !jwtSecret) return response.status(401).json({ message: 'Authentication required.' })
  if (!requireDatabase(response)) return

  try {
    const { userId } = jwt.verify(token, jwtSecret)
    const user = await User.findById(userId)
    if (!user) return response.status(401).json({ message: 'User no longer exists.' })
    response.json({ user: { id: user._id, name: user.name, email: user.email, addresses: user.addresses } })
  } catch (error) {
    response.status(401).json({ message: 'Your session has expired.' })
  }
})

app.patch('/api/auth/me', authenticate, async (request, response) => {
  if (!requireDatabase(response)) return
  const { name, email } = request.body
  if (!name?.trim() || !email?.trim()) return response.status(400).json({ message: 'Name and email are required.' })

  try {
    const user = await User.findByIdAndUpdate(request.userId, { name: name.trim(), email: email.trim().toLowerCase() }, { new: true, runValidators: true })
    if (!user) return response.status(404).json({ message: 'User not found.' })
    response.json({ user: { id: user._id, name: user.name, email: user.email, addresses: user.addresses } })
  } catch (error) {
    if (error.code === 11000) return response.status(409).json({ message: 'That email is already in use.' })
    response.status(500).json({ message: 'Unable to update your profile.' })
  }
})

app.post('/api/auth/me/addresses', authenticate, async (request, response) => {
  if (!requireDatabase(response)) return
  const { label, recipient, line1, city, postalCode, country } = request.body
  if (!recipient?.trim() || !line1?.trim() || !city?.trim() || !postalCode?.trim() || !country?.trim()) return response.status(400).json({ message: 'Recipient, address, city, postal code, and country are required.' })

  try {
    const user = await User.findByIdAndUpdate(request.userId, { $push: { addresses: { id: crypto.randomUUID(), label: label?.trim() || 'Address', recipient: recipient.trim(), line1: line1.trim(), city: city.trim(), postalCode: postalCode.trim(), country: country.trim() } } }, { new: true, runValidators: true })
    response.status(201).json({ addresses: user.addresses })
  } catch (error) {
    response.status(500).json({ message: 'Unable to save this address.' })
  }
})

app.delete('/api/auth/me/addresses/:addressId', authenticate, async (request, response) => {
  if (!requireDatabase(response)) return
  try {
    const user = await User.findByIdAndUpdate(request.userId, { $pull: { addresses: { id: request.params.addressId } } }, { new: true })
    response.json({ addresses: user.addresses })
  } catch (error) {
    response.status(500).json({ message: 'Unable to remove this address.' })
  }
})

app.delete('/api/auth/me', authenticate, async (request, response) => {
  if (!requireDatabase(response)) return
  try {
    await User.findByIdAndDelete(request.userId)
    response.status(204).end()
  } catch (error) {
    response.status(500).json({ message: 'Unable to delete your account.' })
  }
})

async function startServer() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI
  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri)
      console.log('Connected to MongoDB')
      await seedProducts()
    } catch (error) {
      console.error('MongoDB connection failed:', error.message)
    }
  } else {
    console.log('MONGODB_URI is not set; starting without a database connection')
  }

  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`)
  })
}

startServer()
