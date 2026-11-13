(function(){
  "use strict";
  var client=window.supabase&&window.supabase.createClient("https://rfjcgbehvyybthprbvqm.supabase.co","sb_publishable_E7O9tR2EkZP6-RQFrWUySA_m-V1RCnB");
  var grid=document.getElementById("listingGrid"),status=document.getElementById("listingStatus"),empty=document.getElementById("emptyState");
  var search=document.getElementById("searchListings"),filter=document.getElementById("categoryFilter");
  var labels={product:"Product",car:"Car",land:"Land & property",other:"Other"},listings=[];
  function node(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
  function money(value){return "PKR "+new Intl.NumberFormat("en-PK").format(Number(value)||0);}
  function render(){
    if(!grid)return;
    var q=(search.value||"").trim().toLowerCase(),cat=filter.value;
    var items=listings.filter(function(x){return (cat==="all"||x.category===cat)&&(!q||[x.title,x.description,x.city,labels[x.category]].join(" ").toLowerCase().includes(q));});
    grid.replaceChildren();
    items.forEach(function(x){
      var photos=Array.isArray(x.image_urls)?x.image_urls.filter(Boolean):[];
      var card=node("article","listing-card"),gallery=node("div","listing-gallery");
      var photoLink=node("a","listing-gallery-photo");photoLink.href=photos[0]||"#";photoLink.target="_blank";photoLink.rel="noopener noreferrer";photoLink.setAttribute("aria-label","Open photo 1 of "+photos.length+" for "+x.title);
      var img=node("img","listing-image");img.src=photos[0]||"";img.alt=x.title+" photo 1";img.loading="lazy";photoLink.appendChild(img);gallery.appendChild(photoLink);
      if(photos.length>1){
        var index=0,prev=node("button","gallery-arrow gallery-prev","‹"),next=node("button","gallery-arrow gallery-next","›"),count=node("span","gallery-count","1 / "+photos.length),thumbs=node("div","gallery-thumbnails");
        prev.type=next.type="button";prev.setAttribute("aria-label","Previous photo");next.setAttribute("aria-label","Next photo");
        function showPhoto(nextIndex){index=(nextIndex+photos.length)%photos.length;img.src=photos[index];img.alt=x.title+" photo "+(index+1);photoLink.href=photos[index];photoLink.setAttribute("aria-label","Open photo "+(index+1)+" of "+photos.length+" for "+x.title);count.textContent=(index+1)+" / "+photos.length;Array.from(thumbs.children).forEach(function(thumb,i){thumb.setAttribute("aria-pressed",String(i===index));});}
        photos.forEach(function(url,i){var thumb=node("button","gallery-thumb");thumb.type="button";thumb.setAttribute("aria-label","Show photo "+(i+1)+" of "+photos.length);thumb.setAttribute("aria-pressed",String(i===0));var thumbImg=node("img","");thumbImg.src=url;thumbImg.alt="";thumbImg.loading="lazy";thumb.appendChild(thumbImg);thumb.addEventListener("click",function(){showPhoto(i);});thumbs.appendChild(thumb);});
        prev.addEventListener("click",function(){showPhoto(index-1);});next.addEventListener("click",function(){showPhoto(index+1);});
        gallery.append(prev,next,count,thumbs);
      }
      card.appendChild(gallery);
      var copy=node("div","listing-copy");copy.appendChild(node("span","listing-category",labels[x.category]||"Listing"));copy.appendChild(node("h2","",x.title));copy.appendChild(node("div","listing-price",money(x.price)));copy.appendChild(node("p","listing-location","📍 "+x.city));copy.appendChild(node("p","listing-description",x.description));
      var link=node("a","listing-contact","Contact seller on WhatsApp");link.href="https://wa.me/"+String(x.phone||"").replace(/\D/g,"")+"?text="+encodeURIComponent("Hi, I saw your "+x.title+" listing on Innovax Classified.");link.target="_blank";link.rel="noopener noreferrer";copy.appendChild(link);card.appendChild(copy);grid.appendChild(card);
    });
    empty.hidden=items.length>0;status.textContent=items.length+" listing"+(items.length===1?"":"s")+(items.length!==listings.length?" matching":"");
  }
  async function load(){if(!client){status.textContent="Marketplace could not connect. Please try again later.";return;}var result=await client.from("classified_listings").select("id,title,category,description,price,city,phone,image_urls,created_at").eq("active",true).order("created_at",{ascending:false}).limit(100);if(result.error){console.error("Classified listing load error",result.error);status.textContent="Marketplace is being set up. Please try again soon.";return;}listings=result.data||[];render();}
  if(search)search.addEventListener("input",render);if(filter)filter.addEventListener("change",render);
  var year=document.getElementById("year");if(year)year.textContent=new Date().getFullYear();load();
})();
