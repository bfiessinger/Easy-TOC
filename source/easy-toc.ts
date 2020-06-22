interface TocSettings {
  include: Array<string>;
  exclude: Array<string>;
	prefix: string;
	hierarchical: boolean;
	anchor_tagname: string;
  anchor_class: string;
}

const d = document;

/**
 * Shorthand for document.querySelector
 * 
 * @param {string} - a valid querySelector
 * 
 * @returns {Element | null}
 */
const _$ = (s: string): Element | null => { return d.querySelector(s); }

/**
 * Shorthand for document.querySelectorAll
 * 
 * @param {string} - a valid querySelector
 * 
 * @returns {NodeListOf<Element>}
 */
const _$$ = (s: string): NodeListOf<Element> => { return d.querySelectorAll(s); }

/**
 * Table of contents Class
 * 
 * @param {TocSettings} - Object with settings
 */
class easy_toc {
  
  append_to_el: Element;
  settings: TocSettings;
  
	private _includeStr: string;
	private _excludeStr: string;
	
  private _found_selectors: Record<string, unknown>;
  
  private _toc_list_element: Element;

  private _is_rendered: boolean;

	protected _defaults = {
		include: [
			'h1',
			'h2',
			'h3',
			'h4',
			'h5',
			'h6'
		],
		exclude: [
			'[data-no-toc]'
    ],
		prefix: 'easy_toc_',
		hierarchical: true,
		anchor_tagname: 'div',
		anchor_class: 'anchor',
	};
	
	constructor(append_to: string | Element | null, settings: TocSettings) {
    
    this.append_to_el = (append_to !== null && typeof append_to === 'string') ? _$(append_to) : append_to as Element;
    if (!append_to) {
      this.append_to_el = d.body;
    }

		this.settings = this._merge_settings(
			this._defaults, 
			settings || {}
    );
		
		this._includeStr = this.settings.include.join(',');
		this._excludeStr = this.settings.exclude.join(',');
    
    // Initialize found Selectors
    this._found_selectors = {};

    this._toc_list_element = null;

    this._is_rendered = false;
		
	}
	
	/**
	 * Basic Helper Function to merge user defined settings with the defaults Object
	 * 
	 * @param  {object} args Arguments to check
	 * 
	 * @returns {object} Merged Settings Object
   * 
   * @since 1.0.0
	 */
	protected _merge_settings(...args: Array<unknown>): TocSettings {
		const merged = {};
		Array.prototype.forEach.call(args, (obj) => {
			for (const key in obj) {
				if (!Object.prototype.hasOwnProperty.call(obj, key)) {
					return;
				}
				merged[key] = obj[key];
			}
		});
		return merged as TocSettings;
  }
  
  /**
   * Simple getter for nodes that match with the settings object
   * 
   * @return {NodeListOf<Element>} Matching Nodes
   * 
   * @since 1.0.0
   */
  protected _get_nodes(): NodeListOf<Element> {

    let getElements = _$$(this._includeStr);
		if (this.settings.exclude.length > 0) {
      getElements = Array.prototype.slice.call(getElements).filter( (node) => {
				
				if ( ( node.matches || node.matchesSelector || node.msMatchesSelector || node.mozMatchesSelector || node.webkitMatchesSelector || node.oMatchesSelector ).call(node, this._excludeStr) !== true ) {
					return node;
				}
				
			} );
    }
	
    return getElements;

  }

  /**
   * Build an object with all available toc anchors
   * and their related informations
   * 
   * @since 1.0.0
   */
  protected _build_node_obj(): Record<string, unknown> {

		const node_obj = {};
		const slugMap = {};
		
    Array.prototype.forEach.call(this._get_nodes(), (node: Element, index: number) => {

			let cur_heading_level: number;
			if ( this.settings.hierarchical ) {

				let tag_name_matches: Array<string>;
				
				if ((tag_name_matches = /h\d/i.exec(node.tagName)) !== null) {
					cur_heading_level = parseInt( tag_name_matches[0].substr(1,1) );
				} else {
					cur_heading_level = null;
				}

			} else {

				cur_heading_level = null;

			}

			const slug = this._slugify(node.textContent, 0, slugMap);
			slugMap[index] = slug;

      node_obj[index] = {
				el: node,
				heading_level: cur_heading_level,
        className: this.settings.prefix + this.settings.anchor_class,
        id: this.settings.prefix + slug
			}
			
    });

    return node_obj;

	}
	
	/**
	 * Utility for generating unique slugs
	 * 
	 * @param str 
	 * @param recursionCount 
	 * @param slugMap 
	 * 
	 * @since 1.0.0
	 */
	protected _slugify(str: string, recursionCount: number, slugMap: Record<string, unknown>): string {

		let slug = str.trim().toLowerCase().split(' ').join('-').replace(/[!@#$%^&*():]/ig, '').replace(/\//ig, '-');
		if (Object.values(slugMap).indexOf(slug) > -1) {
			recursionCount++;
			slug = this._slugify(str + ' ' + recursionCount, recursionCount, slugMap);
		}
	
		return slug;	
	
	}
	

  /**
   * Basic helper function to wrap Elements
   * 
   * @param el {Element} the Element to unwrap 
   * 
   * @since 1.0.0
   */
	protected _wrap(el: Element, wrapper: Element): void {
    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);
  }
  
  /**
   * Basic helper function to unwrap Elements
   * 
   * @param el {Element} the Element to unwrap
   * 
   * @since 1.0.0
   */
  protected _unwrap(el: Element): void {
    const wrapper = el.parentElement;
    wrapper.insertAdjacentElement('afterend', el);
    wrapper.parentNode.removeChild(wrapper);
  }

  /**
   * Render TOC
   * 
   * @since 1.0.0
   */
  protected _render(): void {

    const selectors = Object.values(this._found_selectors);

		const toc_list_tagname = ( this.settings.hierarchical ) ? 'ol' : 'ul';
    const toc_list = d.createElement(toc_list_tagname);
    toc_list.className = this.settings.prefix + 'list';

    this._toc_list_element = toc_list;

		this.append_to_el.appendChild(toc_list);
		
		let prev_heading_level = null;
		let cur_hierarchical_toc_list = toc_list;
		let cur_hierarchical_level = 1;
    
    // Modify markup of available selectors
    Array.prototype.forEach.call(selectors, (s: { className: string; id: string; el: Element; heading_level: number; }) => {

      const toc_anchor_wrapper = d.createElement(this.settings.anchor_tagname);
      toc_anchor_wrapper.classList.add(s.className);
      toc_anchor_wrapper.id = s.id;
			this._wrap(s.el, toc_anchor_wrapper);
			
      const toc_list_item = d.createElement('li');
      toc_list_item.className = this.settings.prefix + 'list-item';

			if ( this.settings.hierarchical && prev_heading_level !== null && prev_heading_level < s.heading_level ) {

				const hierarchical_toc_list = d.createElement(toc_list_tagname);
				hierarchical_toc_list.setAttribute('data-level', cur_hierarchical_level.toString());
				cur_hierarchical_toc_list.appendChild(hierarchical_toc_list);
				cur_hierarchical_toc_list = hierarchical_toc_list;

				cur_hierarchical_level++;
				
				cur_hierarchical_toc_list.appendChild(toc_list_item);

			} else {

				// Reset hierarchical List Starting point
				cur_hierarchical_toc_list = toc_list;
				toc_list.appendChild(toc_list_item);

			}

      const toc_list_item_link = d.createElement('a');
      toc_list_item_link.className = this.settings.prefix + 'list-item_link';
			toc_list_item_link.href = '#' + s.id;
			toc_list_item_link.setAttribute('data-heading_level', s.heading_level.toString());
      toc_list_item_link.innerText = s.el.textContent;
			toc_list_item.appendChild(toc_list_item_link);
			
			prev_heading_level = s.heading_level;
      
    });

    this._is_rendered = true;

  }
	
	/**
	 * Method: init
	 *
	 * @since 1.0.0
	 */
  init(): void {

		// Destroy any existing initialization
    this.destroy();

    this._found_selectors = this._build_node_obj();
    this._render();

  }

	/**
	 * Method: update - just an alias for init()
	 *
	 * @since 1.0.0
	 */
  update(): void {
    this.init();
  }

	/**
	 * Method: destroy
	 * 
	 * @returns {void}
	 */
  destroy(): void {

    if (this._is_rendered !== false) {

      const selectors = Object.values(this._found_selectors);
      Array.prototype.forEach.call(selectors, (s: { className: string; id: string; el: Element; }) => {
        this._unwrap(s.el);
      });

      this._toc_list_element.parentNode.removeChild(this._toc_list_element);

    }

    this._found_selectors = {};
    this._is_rendered = false;

  }
	
}

export default easy_toc;
