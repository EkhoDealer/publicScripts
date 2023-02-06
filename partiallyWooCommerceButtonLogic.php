<!-- FOR CART -->
<div id="partiallyCartButtonContainer"></div>
<script>
var partiallyConfig = {
     offer: '5db4c9b7-122c-40e3-a454-c5b06ef84d98',
     amount: <?php echo WC()->cart->total; ?>,
     returnUrl: '<?php echo get_site_url(null, '/cart');?>',

     cssButton: true,
     cssButtonText: 'Purchase with',

     cssButtonShowLogo: true,
     cssButtonLogoType: 'full',
     cssButtonLogoPlacement: 'after',



     renderSelector: '#partiallyCartButtonContainer',

    baseUrl: 'https://demo.partial.ly',

    meta: {
        source: 'woocommerce',
        items: [],
        <?php if (WC()->cart->shipping_total > 0 || (WC()->cart->tax_total + WC()->cart->shipping_tax_total) > 0):?>
        subtotal: <?php echo WC()->cart->subtotal_ex_tax;?>,
        <?php if (WC()->cart->tax_total + WC()->cart->shipping_tax_total > 0):?>
        tax: <?php echo WC()->cart->tax_total + WC()->cart->shipping_tax_total;?>,
        <?php endif; ?>
        <?php if (WC()->cart->shipping_total > 0):?>
        shipping: <?php echo WC()->cart->shipping_total;?>,
        <?php endif; ?>
        <?php endif; ?>
    }
   };

   <?php foreach (WC()->cart->get_cart() as $cart_item_key => $item):?>
partiallyConfig.meta.items.push({
id: '<?php echo $cart_item_key;?>',
name: '<?php echo addslashes($item['data']->get_name());?>',
<?php if ($item['data']->get_sku()):?>
sku: '<?php echo $item['data']->get_sku();?>',
<?php endif;?>
price: <?php echo $item['line_subtotal'];?>,
quantity: <?php echo $item['quantity'];?>,
total: <?php echo $item['line_total'];?>,
<?php $thumb = wp_get_attachment_image_src(get_post_thumbnail_id($item['product_id']));
if ($thumb && $thumb[0]):?>
image: '<?php echo $thumb[0];?>',
<?php endif;?>
product_id: '<?php echo $item['product_id'];?>',
<?php if ($item['variation_id']):?>
variant_id: '<?php echo $item['variation_id'];?>'
<?php endif;?>
});
<?php endforeach; ?>

document.partiallyButtonConfig = partiallyConfig;

   (function() {
     var script = document.createElement('script');
     script.type = 'text/javascript';
     script.src = 'https://partial.ly/js/partially-checkout-button.js';
     script.async = true;
     document.head.appendChild(script);
   })();
</script>