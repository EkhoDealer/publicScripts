
<div id="partiallyCartButtonContainer"></div>
<script>
document.partiallyButtonConfig = {
     offer: '5db4c9b7-122c-40e3-a454-c5b06ef84d98',
     returnUrl: '{{shop.url}}/cart',
     returnConfirmedUrl: '{{shop.url}}/cart/clear',

     cssButton: true,
     cssButtonText: 'Purchase with',

     cssButtonShowLogo: true,
     cssButtonLogoType: 'full',
     cssButtonLogoPlacement: 'after',



     renderSelector: '#partiallyCartButtonContainer',

    baseUrl: 'https://demo.partial.ly',

    shopifyCart: {{cart | json}}
   };
   (function() {
     var script = document.createElement('script');
     script.type = 'text/javascript';
     script.src = 'https://partial.ly/js/partially-checkout-button.js';
     script.async = true;
     document.head.appendChild(script);
   })();
</script>
