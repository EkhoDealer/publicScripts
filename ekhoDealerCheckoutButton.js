// Partial.ly checkout button v2.1.2

var EkhoDealerButton = function(config) {
  this.offer = config.offer;
  this.amount = config.amount;
  this.currency = config.currency;
  this.language = config.language;
  this.baseUrl = config.baseUrl || 'http://localhost:3000';


  // make sure baseUrl has no trailing slash
  if (this.baseUrl.slice(-1) == '/') this.baseUrl = this.baseUrl.slice(0, -1);

  this.imageUrl = config.imageUrl || 'https://d2nacfpe3n8791.cloudfront.net/images/purchase-with-partially.png';
  this.returnUrl = config.returnUrl;
  this.returnConfirmedUrl = config.returnConfirmedUrl || this.returnUrl;
  this.customer = config.customer;

  this.downPayment = config.downPayment;
  this.term = config.term;
  this.frequency = config.frequency;

  // renderTarget
  this.renderSelector = config.renderSelector;
  this.quantitySelector = config.quantitySelector;
  this.attachSelector = config.attachSelector;
  this.attachElement = config.attachElement;
  this.noteSelector = config.noteSelector;

  // updated css button config options
  this.cssButton = typeof(config.cssButton) === 'undefined' ? false : config.cssButton;
  this.cssButtonText = config.cssButtonText || 'Order with';
  this.cssButtonShowLogo =  typeof(config.cssButtonShowLogo) === 'undefined' ? true : config.cssButtonShowLogo;
  // full or glyph
  this.cssButtonLogoType = config.cssButtonLogoType || 'full';
  // before or after
  this.cssButtonLogoPlacement = config.cssButtonLogoPlacement || 'after';
  // any valid css color value
  this.cssButtonCustomBg = config.cssButtonCustomBg;
  this.cssButtonTextColor = config.cssButtonTextColor;
  this.cssButtonWidth = config.cssButtonWidth;

  this.startsDate = config.startsDate;

  // see if we should load the html button css
  if (this.cssButton) {
    this.loadButtonCss();
  }

  this.meta = config.meta || {};

  this.utm_campaign = config.utm_campaign === undefined ? 'button' : config.utm_campaign;

  this.elements = {};

  if (this.noteSelector) {
    this.elements.note = document.querySelector(this.noteSelector);
    if (this.elements.note) {
      this.elements.note.addEventListener('keyup', this.noteUpdated.bind(this));
    }
  }

  if (config.woocommerceProduct) {
    this.woocommerceProduct = config.woocommerceProduct;
    this.updateWooProduct();
  }

  if (config.shopifyCart) {
    this.shopifyCart = config.shopifyCart;
    this.updateShopifyCart();
  }

  if (config.shopifyProduct) {
    this.shopifyProduct = config.shopifyProduct;
    this.shopifyVariant = config.shopifyVariant;
    this.updateShopifyProduct();
    // listen for custom event shopify_variant_changed
    document.addEventListener('shopify_variant_changed', this.shopifyVariantUpdated.bind(this));
  }

  if (config.bigcommerceCartItems) {
    this.bigcommerceCartItems = config.bigcommerceCartItems;
    // try to get cart id
    this.getBigCommerceCartId();
    this.updateBigcommerceCart();
  }

  // flag if generated URL too long for browser
  this.urlTruncated = false;

  // google analytics client id
  this.gaClientId = null;
  if (typeof ga === 'function') {
    ga(function(tracker) {
      this.gaClientId = tracker.get('clientId');
      console.log('got analytics client id: '+this.gaClientId);
    });
  }

  if ( ! this.offer) {
    console.warn('PartiallyButton offer not defined');
    return;
  }
  if ( ! this.amount) {
    console.warn('PartiallyButton amount not defined');
    return;
  }
}

function encodeWwwForm(s) {
  return encodeURIComponent(s).replace(/%20/g, '+');
}

function isEmpty(obj) {

    // null and undefined are "empty"
    if (obj == null) return true;

    // Assume if it has a length property with a non-zero value
    // that that property is correct.
    if (obj.length > 0)    return false;
    if (obj.length === 0)  return true;

    // Otherwise, does it have any properties of its own?
    // Note that this doesn't handle
    // toString and valueOf enumeration bugs in IE < 9
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }

    return true;
}

EkhoDealerButton.prototype.updateShopifyCart = function() {
  this.meta.source = 'shopify';
  this.meta.items = [];
  this.amount = this.shopifyCart.total_price / 100;

  for (var i = 0; i < this.shopifyCart.items.length; i++) {
    var item = this.shopifyCart.items[i];
    var data = {
      id: item.id,
      variant_id: item.variant_id,
      product_id: item.product_id,
      name: item.title,
      sku: item.sku,
      price: item.price / 100,
      quantity: item.quantity,
      total: item.line_price / 100,
      options: item.options_with_values,
      product: item.product,
    };
    // this will factor in cart discounts
    // unit price
    if (typeof item.final_price != 'undefined') data.price = item.final_price / 100;
    // total line price
    if (typeof item.final_line_price != 'undefined') data.total = item.final_line_price / 100;
    // needed when creating order with shopify
    if (item.total_discount) data.discount = item.total_discount / 100;
    if (item.image) {
      // data.image = item.image.replace(/(\.[^.]*)$/, "_small$1");
      data.image = item.image.replace(/(\.[^.]*)$/, "_large$1");
      if (data.image.startsWith('//')) data.image = 'https:' + data.image;
    }
    if (item.grams) {
      data.weight = item.grams;
      data.weight_units = 'g';
    }
    if ( ! isEmpty(item.properties)) data.properties = item.properties;
    this.meta.items.push(data);
  }

  if (this.shopifyCart.note) this.meta.note = this.shopifyCart.note;
  if (this.shopifyCart.attributes) this.meta.attributes = this.shopifyCart.attributes;
  // check for Shopify currency (new Shopify multi-currency support)
  if (this.shopifyCart.currency) this.currency = this.shopifyCart.currency;
}

EkhoDealerButton.prototype.updateShopifyProduct = function() {
  console.log('PartiallyButton - setting shopify product');
  this.meta.source = 'shopify';
  var p = this.shopifyProduct;
  if ( ! this.amount) this.amount = p.price / 100;
  var item = {
    id: p.id,
    product_id: p.id,
    name: p.title,
    quantity: 1,
    price: p.price / 100,
    total: p.price / 100,
    options: p.options_with_values,
  };
  if (p.featured_image) {
    // item.image = p.featured_image.replace(/(\.[^.]*)$/, "_small$1");
    item.image = p.featured_image.replace(/(\.[^.]*)$/, "_large$1");
    if (item.image.startsWith('//')) item.image = 'https:' + item.image;
  }
  if (this.shopifyVariant) {
    item.variant_id = this.shopifyVariant.id;
    item.sku = this.shopifyVariant.sku;
    item.weight = this.shopifyVariant.weight;
    item.weight_units = this.shopifyVariant.weight_unit ? this.shopifyVariant.weigh_unit : 'g';
    item.price = this.shopifyVariant.price / 100;
    item.total = item.price;
    this.amount = item.price;
    item.name = this.shopifyVariant.name;
    if (this.shopifyVariant.featured_image && typeof this.shopifyVariant.featured_image == 'string') {
      item.image = this.shopifyVariant.featured_image.replace(/(\.[^.]*)$/, "_small$1");
      if (item.image.startsWith('//')) item.image = 'https:' + item.image;
    }
    else if (typeof this.shopifyVariant.featured_image == 'object' && this.shopifyVariant.featured_image != null && this.shopifyVariant.featured_image.src) {
      item.image = this.shopifyVariant.featured_image.src.replace(/(\.[^.]*)$/, "_small$1");
      if (item.image.startsWith('//')) item.image = 'https:' + item.image;
    }
  }
  this.meta.items = [item];
}

EkhoDealerButton.prototype.shopifyVariantUpdated = function(e) {
  var variant = e.detail;
  console.log('PartiallyButton - shopify variant updated');
  if (variant && variant.available) {
    this.shopifyVariant = variant;
    var item = this.meta.items[0];
    item.variant_id = this.shopifyVariant.id;
    item.sku = this.shopifyVariant.sku;
    item.weight = this.shopifyVariant.weight;
    item.price = this.shopifyVariant.price / 100;
    item.total = item.price * item.quantity;
    this.amount = item.price * item.quantity;
    item.name = this.shopifyVariant.name;
    if (typeof this.shopifyVariant.featured_image == 'string') {
      // item.image = this.shopifyVariant.featured_image.replace(/(\.[^.]*)$/, "_small$1");
      item.image = this.shopifyVariant.featured_image.replace(/(\.[^.]*)$/, "_large$1");
    }
    if (typeof this.shopifyVariant.featured_image == 'object' && this.shopifyVariant.featured_image != null && this.shopifyVariant.featured_image.src) {
      // item.image = this.shopifyVariant.featured_image.src.replace(/(\.[^.]*)$/, "_small$1");
      item.image = this.shopifyVariant.featured_image.src.replace(/(\.[^.]*)$/, "_large$1");
    }

    if (item.image && item.image.startsWith('//')) item.image = 'https:' + item.image;

    if (this.elements.button) {
      console.log('PartiallyButton updating button href');
      this.elements.button.setAttribute('href', this.generateUrl());
    }
  }
}

EkhoDealerButton.prototype.updateWooProduct = function() {
  this.meta.source = 'woocommerce';
  // load woo product details
  var p = this.woocommerceProduct;
  if ( ! this.amount) this.amount = p.price;
  this.meta.items = [{
    id: p.id,
    product_id: p.id,
    name: p.name,
    quantity: 1,
    price: p.price,
    total: p.price,
    sku: p.sku,
    weight: p.weight,
    image: p.image
  }];

  this.attachWooVariantListener();
}

EkhoDealerButton.prototype.attachWooVariantListener = function() {
  var el = document.querySelector('.single_variation_wrap');
  // woo commerce uses jquery, so should be available
  if (el && jQuery) {
    // can only listen from jquery
    jQuery('.single_variation_wrap').on('show_variation', function(event, variation) {
      console.log('PartiallyButton caught variation changed');
      console.log(variation);
      var variantName = Object.keys(variation.attributes)
         .map(function(k) {
           return k.slice(k.indexOf('_') + 1) + ': '+variation.attributes[k];
         }).join('; ');

        var item = this.meta.items[0];

        this.amount = variation.display_price * item.quantity;
        item.price = variation.display_price;
        item.total = this.amount;
        // maybe update sku too
        // add variant name to product name
        item.name = this.woocommerceProduct.name + ' - ' + variantName;
        item.variant_id = variation.variation_id;
        // reset button href
        if (this.elements.button) {
          console.log('PartiallyButton updating button href');
          this.elements.button.setAttribute('href', this.generateUrl());
        }
    }.bind(this));
  }
}

EkhoDealerButton.prototype.getBigCommerceCartId = function() {
  // make sure it's not already set
  if (this.meta.bigcommerce_cart_id) return;

  var req = new XMLHttpRequest();
  req.responseType = 'json';
  req.withCredentials = true;

  req.onreadystatechange = function() {
    if (req.readyState === 4) {
      if (req.status === 200) {
        var cart = req.response;
        if (Array.isArray(cart)) {
          cart = cart[0];
        }
        this.meta.bigcommerce_cart_id = cart.id;
        // see if we need to
        if (this.elements.button) {
          console.log('PartiallyButton updating button href with BigCommerce cart id '+this.meta.bigcommerce_cart_id);
          if (this.urlTruncated) {
            this.addHiddenInput('meta[bigcommerce_cart_id]', this.meta.bigcommerce_cart_id);
          }
          else {
            this.elements.button.setAttribute('href', this.generateUrl());
          }
        }
      }
      else {
        console.error('partial.ly: error getting BigCommerce cart');
      }
    }
  }.bind(this);

  var url = '/api/storefront/cart';
  console.log('getting '+url);
  req.open('GET', url, true);
  req.send();
}
// this is the version we get from stencil
// looks like storefront api uses different fields grrr
EkhoDealerButton.prototype.updateBigcommerceCart = function() {
  this.meta.source = 'bigcommerce';
  this.meta.items = [];

  for (var i = 0; i < this.bigcommerceCartItems.length; i++) {
    var item = this.bigcommerceCartItems[i];
    // check for storefront api cart item
    if (item.productId) {
      var data = {
        id: item.id,
        product_id: item.productId,
        name: item.name,
        sku: item.sku,
        price: item.salePrice,
        quantity: item.quantity,
        total: item.extendedSalePrice
      };
      if (item.variantId) data.variant_id = item.variantId;
      if (item.imageUrl) {
        data.image = item.imageUrl;
      }
    }
    else {
      // stencil object
      var data = {
        id: item.id,
        //variant_id: item.variant_id,
        product_id: item.product_id,
        name: item.name,
        sku: item.sku,
        price: item.price.value,
        quantity: item.quantity,
        total: item.total.value
      };
      // check for discounted price
      if (item.price_discounted) {
        data.price = item.price_discounted.value;
      }
      if (item.total_discounted) {
        data.total = item.total_discounted.value;
      }
      if (item.image) {
        data.image = item.image.data.replace('{:size}', '78x78');
      }
      // no weight it seems
      if ( ! isEmpty(item.options)) {
        data.properties = {};
        for (var j = 0; j < item.options.length; j++) {
          var opt = item.options[j];
          data.properties[opt.name] = opt.value;
        }
      }

      // add configurable fields to item meta, since we can't send back to bigcommerce
      if ( ! isEmpty(item.configurable_fields)) {
        data.configurable_fields = item.configurable_fields;
      }
    }
    this.meta.items.push(data);
  }
}

function serialize(obj, prefix) {
  var str = [],
  p;
  for (p in obj) {
    if (obj.hasOwnProperty(p)) {
        var k = prefix ? prefix + "[" + p + "]" : p,
        v = obj[p];
        if (v !== null) {
            if (Array.isArray(v)) {    
                for (var i = 0; i < v.length; i++) {
                    str.push(serialize(v[i], k + '[' + i + ']'));
                }
            }
            else if (typeof v === 'object') {
                str.push(serialize(v, k));
            }
            else {
                str.push(encodeURIComponent(k) + "=" + encodeURIComponent(v));
            }
        }
    }
  }
  return str.join("&");
}

EkhoDealerButton.prototype.generateUrl = function() {
  // build the URL
  var url = this.baseUrl + '/checkout?offer='+this.offer+'&amount='+this.amount

  // check for a return url
  if (this.returnUrl) {
    url += '&returnUrl='+encodeURIComponent(this.returnUrl);
  }

  if (this.returnConfirmedUrl) {
    url += '&returnConfirmedUrl='+encodeURIComponent(this.returnConfirmedUrl);
  }

  if (this.gaClientId) url += '&_ga='+this.gaClientId;

  // check for note selector
  if (this.noteSelector && ! this.meta.note) {
    var noteElement = document.querySelector(this.noteSelector);
    if (noteElement && noteElement.value) this.meta.note = noteElement.value;
  }

  if (this.currency) url += '&currency=' + this.currency;
  if (this.language) url += '&language=' + this.language;
  if (this.utm_campaign) url += '&utm_campaign=' + this.utm_campaign;

  if (this.customer) {
    for (var key in this.customer) {
      url += '&customer['+key+']='+encodeURIComponent(this.customer[key]);
    }
  }

  // add meta information
  if (this.meta && Object.keys(this.meta).length !== 0 && this.meta.constructor === Object) url += '&' + serialize(this.meta, 'meta');
  if (this.startsDate)  url += '&startsDate=' + this.startsDate;

  //add widget params if available
  if (this.downPayment) url += '&payment_schedule[down_payment_amount]=' + this.downPayment;
  if (this.term)        url += '&payment_schedule[term]=' + this.term;
  if (this.frequency)   url += '&payment_schedule[frequency]=' + this.frequency;

  return url;
}

EkhoDealerButton.prototype.addHiddenInput = function(name, value) {
  var input = document.createElement('input');
  input.setAttribute('type', 'hidden');
  input.setAttribute('name', name);
  input.setAttribute('value', value);
  this.elements.form.appendChild(input);
}

// Used when the URL generated is too long
EkhoDealerButton.prototype.generateForm = function() {
  var form = this.elements.form;
  if ( ! form) {
    form = document.createElement('form');

    form.method = 'post';

    var url = this.baseUrl + '/checkout';

    form.setAttribute('action', url);
    document.body.appendChild(form);
    this.elements.form = form;
  }

  // clear child elements in case it's already been set
  form.innerHTML = '';

  // add hidden inputs
  this.addHiddenInput('offer', this.offer);
  this.addHiddenInput('amount', this.amount);

  // check for a return url
  if (this.returnUrl) {
    this.addHiddenInput('returnUrl', this.returnUrl);
  }

  if (this.returnConfirmedUrl) {
    this.addHiddenInput('returnConfirmedUrl', this.returnConfirmedUrl);
  }

  if (this.currency) {
    this.addHiddenInput('currency', this.currency);
  }
  if (this.language) {
    this.addHiddenInput('language', this.language);
  }
  if (this.utm_campaign) {
    this.addHiddenInput('utm_campaign', this.utm_campaign);
  }
  if (this.gaClientId) {
    this.addHiddenInput('_ga', this.gaClientId);
  }

  if (this.customer) {
    for (var key in this.customer) {
      this.addHiddenInput('customer['+key+']', this.customer[key]);
    }
  }

  // add meta information
  if (this.meta) {
    for (var key in this.meta) {
      if (this.meta.hasOwnProperty(key)) {
        var prop = this.meta[key];

        // see if property is an array (probably only items is)
        if (Array.isArray(prop)) {
          // assume property is an array of objects
          for (var index in prop) {
            var item = prop[index];
            for (var itemKey in item) {
              if (item.hasOwnProperty(itemKey)) {
                var val = item[itemKey];
                if (typeof(val) == 'object') {
                    for (var valKey in val) {
                      if (val.hasOwnProperty(valKey)) {
                          this.addHiddenInput('meta['+key+']['+index+']['+itemKey+']['+encodeWwwForm(valKey)+']', val[valKey]);
                      }
                    }
                }
                else {
                  this.addHiddenInput('meta['+key+']['+index+']['+itemKey+']', val);
                }
              }
            }
          }
        }
        else if (typeof(prop) == 'object') {
          for (var k in prop) {
            if (typeof(k) == 'string' && typeof(prop[k]) == 'string') {
              this.addHiddenInput('meta['+key+']['+k+']', prop[k]);
            }
          }
        }
        else {
          // simple property (string or number)
          this.addHiddenInput('meta['+key+']', prop);
        }
      }
    }
  }

}

EkhoDealerButton.prototype.renderButton = function() {
  var el = document.querySelector(this.renderSelector);
  if (el) {
    var btn = document.createElement('a');
    var generatedUrl = this.generateUrl();
    btn.setAttribute('href', generatedUrl);
    btn.setAttribute('class', 'ekhoDealerCheckoutButton');

    if (this.cssButtonWidth) {
      btn.style.width = this.cssButtonWidth;
    }

    if (this.cssButton) {
      var txt = document.createElement('span');
      txt.innerText = this.cssButtonText;

      if (this.cssButtonTextColor) {
        txt.style.color = this.cssButtonTextColor;
      }

      btn.appendChild(txt);

      if (this.cssButtonShowLogo && this.cssButtonLogoType !== 'none') {
        btn.classList.add('showLogo');
        btn.classList.add(this.cssButtonLogoPlacement == 'before' ? 'logoBefore' : 'logoAfter');

        if (this.cssButtonLogoType == 'glyph') {
          btn.classList.add('logoGlyph');
        }

      }

      if (this.cssButtonCustomBg) {
        btn.style.backgroundColor = this.cssButtonCustomBg;
      }
      else {
        btn.classList.add('gradientBg');
      }
    }
    else {
      // img for the button
      var img = document.createElement('img');
      img.setAttribute('src', this.imageUrl);
      img.setAttribute('alt', 'Purchase with Ekho Dealer');
      btn.appendChild(img);
    }

    el.appendChild(btn);

    this.elements.button = btn;

    // test if browser truncated URL
    if (btn.href != generatedUrl || btn.href.length > 11000) {
      console.warn('Ekho Dealer: Checkout URL is too long. Generating form to POST checkout data to Ekho Dealer');
      this.urlTruncated = true;
      // generate the form
      this.generateForm();
    }

    // attach click handler
    btn.addEventListener('click', this.buttonClicked.bind(this));
  }
  else {
    console.warn('PartiallyButton could not render to selector '+this.renderSelector);
  }
}

EkhoDealerButton.prototype.attachButton = function() {
  var btn = this.attachElement || document.querySelector(this.attachSelector);
  if (btn) {
    this.elements.button = btn;
    var generatedUrl = this.generateUrl();
    btn.setAttribute('href', generatedUrl);
    // test if browser truncated URL
    if (btn.href != generatedUrl) {
      console.warn('Partial.ly: browser truncated URL. Generating form');
      this.urlTruncated = true;
      // generate the form
      this.generateForm();
    }

    // attach click handler
    btn.addEventListener('click', this.buttonClicked.bind(this));
  }
  else {
    console.warn('PartiallyButton could not attach to element at '+this.attachSelector);
  }
}

EkhoDealerButton.prototype.buttonClicked = function(e) {
  console.log('PartiallyButton clicked');
  e.preventDefault();
  e.stopImmediatePropagation();
  console.log('PartiallyButton - stopped event propagation');

  if (this.urlTruncated && this.elements.form) {
    this.elements.form.submit();
    return false;
  }
  else {
    document.location.href = this.elements.button.href;
  }

}

EkhoDealerButton.prototype.quantityUpdateEvent = function(e) {
  var q = parseFloat(e.target.value);
  // assume we're only dealing with a single product
  var prod = this.meta.items[0];
  if ( ! isNaN(q) && q > 0 && q != prod.quantity) {
      // update qty
      prod.quantity = q;
      prod.total = q * prod.price;
      this.amount = prod.total;
      console.log('PartiallyButton updated qty to '+q+' and amount='+this.amount);
      // update amount
      // reset button href
      this.updateButtonHref();
  }
}

EkhoDealerButton.prototype.noteUpdated = function() {
  this.meta.note = this.elements.note.value;
  this.updateButtonHref();
}

EkhoDealerButton.prototype.attachQuantityListener = function() {
  var el = document.querySelector(this.quantitySelector);
  if ( ! el) {
    console.warn('PartiallyButton could not find quantity with selector '+this.quantitySelector);
    return;
  }
  el.addEventListener('keyup', this.quantityUpdateEvent.bind(this));
  el.addEventListener('input', this.quantityUpdateEvent.bind(this));
  el.addEventListener('change', this.quantityUpdateEvent.bind(this));
}

EkhoDealerButton.prototype.loadButtonCss = function() {
  var head = document.head;
  var link = document.createElement('link');
  link.type = 'text/css'
  link.rel = 'stylesheet'
  // link.href = this.baseUrl + '/css/partially-button.css';
  link.href = 'https://ekhodealer.github.io/publicScripts/ekhoDealerCheckoutButton.css'

  head.appendChild(link);
}

EkhoDealerButton.prototype.updateButtonHref = function() {
  if (this.elements.button) {
    this.elements.button.setAttribute('href', this.generateUrl());
  }
}


EkhoDealerButton.prototype.init = function() {
  if (this.renderSelector) {
    this.renderButton();
  }
  if (this.attachSelector || this.attachElement) {
    this.attachButton();
  }
  if (this.quantitySelector) {
    this.attachQuantityListener();
  }
}

window.PartiallyButton = EkhoDealerButton;

// see if there's a default config to auto init a button
if (document.partiallyButtonConfig) {
  var btn = new EkhoDealerButton(document.partiallyButtonConfig);
  btn.init();
}