const e="be46a73c-f689-4beb-bac7-36e2c6c9deac",t={currentPage:1,totalPages:1,currentSearchTerm:"",cache:new Map};document.getElementById("app").innerHTML=`
    <div class="container">
        <h1>Pok\xe9mon TCG Quick Search</h1>
        <div class="search-container">
            <input type="text" id="card-name-input" placeholder="Enter card name (e.g., Pikachu)">
            <button id="search-button">Search</button>
        </div>
        <div class="options-container">
            <input type="checkbox" id="sort-by-newest-checkbox">
            <label for="sort-by-newest-checkbox">Sort by newest (slower)</label>
        </div>
        <div id="results-container"></div>
        <div id="pagination-container"></div>
        <div id="diagnostics-container"></div>
    </div>
`;const a=document.getElementById("search-button"),r=document.getElementById("card-name-input"),n=document.getElementById("sort-by-newest-checkbox"),i=document.getElementById("results-container"),c=document.getElementById("pagination-container"),s=document.getElementById("diagnostics-container"),o=async(e,a)=>{t.currentSearchTerm=e,t.currentPage=a,await d(e,a)},d=async(a,r)=>{v(),g(),s.innerHTML="";let c=n.checked,o=performance.now();try{let n=new URL("https://api.pokemontcg.io/v2/cards"),d={q:`name:${a}*`,page:r,pageSize:5,select:"id"};c&&(d.orderBy="-set.releaseDate"),n.search=new URLSearchParams(d).toString();let h=await fetch(n,{headers:{"X-Api-Key":e}});if(!h.ok)throw Error(`HTTP error! status: ${h.status}`);let m=await h.json();if(0===m.data.length)return void b("Card not found. Please try another search.");t.totalPages=Math.ceil(m.totalCount/5),p(),i.innerHTML="";let u=performance.now();s.innerHTML=`ID Fetch Time: ${(u-o).toFixed(2)} ms. Now fetching details...`,m.data.map(e=>l(e.id))}catch(e){console.error("Fetch error:",e),b("An error occurred while fetching card data.")}finally{y()}},l=async a=>{let r=`card_${a}`;if(t.cache.has(r))return void h(t.cache.get(r));let n=new URL(`https://api.pokemontcg.io/v2/cards/${a}`);n.search=new URLSearchParams({select:"name,images,types,abilities,tcgplayer"}).toString();try{let i=await fetch(n,{headers:{"X-Api-Key":e}});if(!i.ok)throw Error(`Failed to fetch card ${a}`);let c=(await i.json()).data;t.cache.set(r,c),h(c)}catch(e){console.error(e)}},h=e=>{let t=document.createElement("div");t.className="card-result";let a=e.images?.small||"";t.innerHTML=`
        <div class="card-image">
            <img src="${a}" alt="${e.name}" loading="lazy">
        </div>
        <div class="card-details">
            <h2>${e.name}</h2>
            <p><strong>Type:</strong> ${e.types?e.types.join(", "):"N/A"}</p>
            ${m(e.abilities)}
            ${u(e.tcgplayer?.prices)}
        </div>
    `,i.appendChild(t)},m=e=>e?`
        <h3>Abilities</h3>
        <ul class="abilities-list">
            ${e.map(e=>`<li><strong>${e.name}:</strong> ${e.text}</li>`).join("")}
        </ul>
    `:"",u=e=>{if(!e)return"";let t=Object.entries(e).map(([e,t])=>t&&t.market?`<li><strong>${e}:</strong> ${t.market.toFixed(2)}</li>`:"").join("");return`
        <h3>Market Prices (from TCGplayer)</h3>
        <ul class="prices-list">${t}</ul>
    `},p=()=>{if(c.innerHTML="",t.totalPages<=1)return;let e=document.createElement("button");e.textContent="Previous",e.disabled=1===t.currentPage,e.addEventListener("click",()=>{t.currentPage>1&&o(t.currentSearchTerm,t.currentPage-1)});let a=document.createElement("button");a.textContent="Next",a.disabled=t.currentPage===t.totalPages,a.addEventListener("click",()=>{t.currentPage<t.totalPages&&o(t.currentSearchTerm,t.currentPage+1)});let r=document.createElement("span");r.textContent=`Page ${t.currentPage} of ${t.totalPages}`,r.style.margin="0 10px",c.appendChild(e),c.appendChild(r),c.appendChild(a)},g=()=>{a.disabled=!0,r.disabled=!0,n.disabled=!0,Array.from(c.children).forEach(e=>e.disabled=!0)},y=()=>{a.disabled=!1,r.disabled=!1,n.disabled=!1},b=e=>{i.innerHTML=`<p class="error-message">${e}</p>`,c.innerHTML="",s.innerHTML=""},v=()=>{i.innerHTML='<div class="spinner-container"><div class="spinner"></div></div>',c.innerHTML="",s.innerHTML=""};a.addEventListener("click",()=>{let e=r.value.trim();e&&o(e,1)}),r.addEventListener("keyup",e=>{"Enter"===e.key&&a.click()});
//# sourceMappingURL=tcg-quicksearch.c1596775.js.map
