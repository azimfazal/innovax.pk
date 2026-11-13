(function(){
  "use strict";
  var URL="https://rfjcgbehvyybthprbvqm.supabase.co",KEY="sb_publishable_E7O9tR2EkZP6-RQFrWUySA_m-V1RCnB",BUCKET="classified-images";
  var client=window.supabase&&window.supabase.createClient(URL,KEY),form=document.getElementById("listingForm"),files=document.getElementById("images"),preview=document.getElementById("imagePreview"),notice=document.getElementById("formStatus"),submit=document.getElementById("submitButton");
  var year=document.getElementById("year");if(year)year.textContent=new Date().getFullYear();
  function message(text,kind){notice.textContent=text;notice.className="notice"+(kind?" "+kind:"");}
  function validate(fileList){if(!fileList.length||fileList.length>5)return "Choose between 1 and 5 photos.";for(var i=0;i<fileList.length;i++){var f=fileList[i];if(!["image/jpeg","image/png","image/webp"].includes(f.type))return "Photos must be JPG, PNG or WebP.";if(f.size>5*1024*1024)return "Each photo must be smaller than 5 MB.";}return "";}
  files.addEventListener("change",function(){preview.replaceChildren();var error=validate(files.files);if(error){message(error,"error");return;}Array.from(files.files).forEach(function(file){var img=document.createElement("img");img.alt="Selected listing photo";img.src=window.URL.createObjectURL(file);preview.appendChild(img);});message(" ","");});
  form.addEventListener("submit",async function(event){event.preventDefault();message("","");if(!client){message("The listing service is unavailable. Please try again later.","error");return;}if(form.website.value)return;var problem=validate(files.files);if(problem){message(problem,"error");return;}submit.disabled=true;submit.textContent="Uploading photos…";
    var uploaded=[];
    try{
      for(var i=0;i<files.files.length;i++){var file=files.files[i],ext=file.type==="image/png"?"png":file.type==="image/webp"?"webp":"jpg",path=Date.now()+"-"+crypto.randomUUID()+"."+ext;var up=await client.storage.from(BUCKET).upload(path,file,{contentType:file.type,upsert:false});if(up.error)throw up.error;uploaded.push(client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);}
      submit.textContent="Publishing ad…";var data=new FormData(form);var phone=String(data.get("phone")).replace(/[^0-9+]/g,"");var result=await client.from("classified_listings").insert({title:String(data.get("title")).trim(),category:String(data.get("category")),description:String(data.get("description")).trim(),price:Number(data.get("price")),city:String(data.get("city")).trim(),phone:phone,image_urls:uploaded,active:true}).select("id").single();if(result.error)throw result.error;
      form.reset();preview.replaceChildren();message("Your ad is live! Visit Innovax Classified to see it.","success");submit.textContent="Ad published";setTimeout(function(){submit.disabled=false;submit.textContent="Publish ad";},2500);
    }catch(error){console.error("Classified submission error",error);message("Could not publish your ad. Please try again. If this continues, contact Innovax.","error");submit.disabled=false;submit.textContent="Publish ad";}
  });
})();
