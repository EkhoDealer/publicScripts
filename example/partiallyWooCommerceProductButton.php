<?php global $product; ?>

<div id="partiallyProductButtonContainer"></div>
<script>
    document.partiallyButtonConfig = {
     offer: '5db4c9b7-122c-40e3-a454-c5b06ef84d98',
     amount: <?php echo WC()->cart->total; ?>,
     returnUrl: '<?php echo get_site_url(null, '/cart');?>',

     cssButton: true,
     cssButtonText: 'Purchase with',

     cssButtonShowLogo: true,
     cssButtonLogoType: 'full',
     cssButtonLogoPlacement: 'after',



     renderSelector: '#partiallyProductButtonContainer',

    baseUrl: 'https://demo.partial.ly',

   woocommerceProduct: <?php echo json_encode($product->get_data());?>,
   };

   (function() {
     var script = document.createElement('script');
     script.type = 'text/javascript';
     script.src = 'https://partial.ly/js/partially-checkout-button.js';
     script.async = true;
     document.head.appendChild(script);
   })();
</script>