/**
 * Header, Footer and Site Navigation custom HTML elements for the app.
 * @author Bryan Haberberger
 */ 

class DLAPublicFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <style>
            gm-footer{
                display: block;
                text-align: center;
                background-color: var(--site-light);
                z-index: 1;
                position: fixed;
                bottom: 0;
                width: 100%;
            }

            gm-footer .brand{
                height: 2em;
                margin-right: 5px;
            }

            gm-footer a{
                text-decoration: none;
                display: -webkit-box;
                display: -ms-flexbox;
                display: flex;
                -webkit-box-align: center;
                -ms-flex-align: center;
                align-items: center;
                padding: 1rem 2rem;
                color: var(--color-darkGrey);
            }

            gm-footer div {
                display: inline-flex;
            }
        </style>
        <gm-footer>
            <div>
                <a target="_blank" href="https://www.slu.edu/research/faculty-resources/research-computing.php">
                    <img class="brand" src="/images/rcg-logo.jpg"> 
                    ©2022 Research Computing Group
                </a>
            </div>
            <div>
                <a target="_blank" href="https://udayton.edu/blogs/artssciences/2022-stories/22-08-16-dunbar-video.php">
                    <img class="brand" src="/images/ud-logo-horizontal.jpg">
                </a>
            </div>
        </gm-footer>
        `
        this.classList.add('nav', 'nav-center', 'text-primary', 'is-fixed', 'is-full-width', 'is-vertical-align')
    }
}
customElements.define("dla-footer", DLAPublicFooter)

class DLAPublicHeader extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <style>
            header{
              display: flex;
              justify-items: stretch;
              height:  10em;
              overflow:  hidden;
              margin-bottom:  2em;
              border-bottom:  2px solid black;
              margin-top:  1em;
              position:relative;
            }

            header h1 {
              text-shadow: 0 0 1.5px var(--ud-secondary);
              color: var(--ud-blue);
              font-size: 4rem;
              font-family: 'Homemade Apple', cursive;
              text-align: center;
                flex-grow: 4;
                align-self: center;
            }

            header.small {
              margin: calc(var(--body-padding) * -1) 0 0px;
              height: 75px;
            }

            header.small h1 {
              font-size: 2rem;
            }

            logoimg {
                overflow:hidden;
                position:absolute;
                height:100%;
                left: calc(-1*var(--body-padding));
                width: 100vw;
            }

            logoimg img {
              position: relative;
              z-index: -1;
            }
            a:has(img.paul){
                z-index:1;
            }
            img.paul{
              height: 140%;
              margin: -20%;
              box-shadow: -2px 2px 5px var(--ud-secondary);
              border-bottom-right-radius: 25%;
              border-bottom-left-radius: 25%;
            }
        </style>
        <header class="small">
            <a href="/" title="Home">
                <img class="paul" src="https://cdm16007.contentdm.oclc.org/iiif/2/p267401coll32:4553/100,0,1100,1100/150,150/0/default.jpg">
            </a>
            <logoimg>
                <img src="" alt="logo">    
            </logoimg>
            <h1>Dunbar Library & Archive</h1>
        </header>
        <nav class="tabs">
            <a href="/collections">Collections</a>
            <a href="/browse" class="">Browse</a>
            <a href="/about" class="">About</a>
        </nav>
        `
        this.querySelector(`.tabs a[href*="${location.pathname.split('/')[1]}"]`)?.classList.add("active")
        this.querySelector(`logoimg img`).setAttribute("src", `/images/logo-${location.pathname.split('/')[1].replace(".html","")}.jpg`)
    }
}
customElements.define("dla-header", DLAPublicHeader)
