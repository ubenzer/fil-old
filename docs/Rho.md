# Rho

[Rho](https://github.com/inca/rho) is a markdown-like language that converts a formatted text into HTML. Fil uses 
rho to convert text to HTML on compile time.

## The Rho Language
The main rule is, if you know `markdown` it is **probably** the same in **rho**, so just write markdown.

To learn all features of rho [go here](http://inca.github.io/rho/#syntax) or for a more formal and complete one
[go here](https://github.com/inca/rho/blob/master/SYNTAX.md).

### Extras
There are some extensions to Rho to provide fil specific features or extra features that might come handy. :=)

#### Linking
Content assets (files that are in the content folder) can be linked directly.

`[link to content asset](relative/path/to/contentAsset.zip)`

Other contents can be linked:

`[link to other content](@contentid)`
OR
`[link to other content](@contentid@)`

Other contents' assets can be linked:

`[link to other content asset](@contentid@/contentAsset.zip)`

**Please note that the following are not implemented yet, subject to change***

Collection list can be linked:
`[link to collections](@@)`

A collection can be linked:
`[link to collections](@@category)`

A collection category, subcategory (with a specific page) can be linked:
`[link to collections](@@category/Programming)`
`[link to collections](@@category/Programming/12)`
`[link to collections](@@category/Programming/Javascript)`
`[link to collections](@@category/Programming/Javascript/12)`

Pages can be linked:
`[the page](@@@about-me)`
`[the page](@@@url/to/page)`

All links can be "flagged" with bunch flags. This flags can be used in templates to do special actions, such as 
opening in new tab, assigning a different class etc.

`[any link](https://ubenzer.com){new, nofollow, other, flags}`

`[any link](@contentid){new}`

For absolute links, you can use the usual markdown without any mambo-jumbo. You can (of course) use absolute links
also for in-site navigation, but this is an anti-pattern. **We strongly recommend you to use relative links for 
in-site navigation. Relative links are checked on compile time and it WILL throw error if you are linking to
something nonexistent.**
 
#### Images
Content assets that are images be shown on the content as images directly. It works similar to links on the previous
section, just add `!` in the beginning:
    
`![alternative text](relative/path/to/contentAsset.jpg)`

`![alternative text](@contentid/relative/path/to/contentAssetThatBelongsToOtherContent.gif)`
OR
`![alternative text](@contentid@/relative/path/to/contentAssetThatBelongsToOtherContent.gif)`

Just like the links, you can also "flag" images, and you can use the markdown as we know it for the absolute urls.

`![alternative text](https://ubenzer.com/image.jpg){selflink, aligncenter}`

**We strongly recommend you to use relative image urls for hosted images. Relative urls are checked on compile 
time and it WILL throw error if you are linking to something nonexistent.**

##### Image resizing
Fil has a built-in image optimization mechanism for hosted images. You can specify which sizes and extensions you
want original image to be converted to in `filconfig` file. When site compiled, you'll all images resized as you
configured. You can use them with `picture` html5 element or conditionally render via "flags" etc. on your template.

`fil-starter-project` uses `picture` element to display different sizes of the same image depending on the screen
size and screen resolution. It also servers `webp` format for supported browsers.

Resized images are cached across compilations to increase compile speed.

**TODO** Currently caching mechanism is stupid. It just checks existence of target file. If source file changes,
it will not be noticed. Needs improving.

**TODO** Currently rendering `picture` tag is embedded into Rho compiler, into `fil` project. :( It is going to be
extracted to starter project, probably as a tag.

#### Shortcodes & Tags
Fil supports using shortcodes with a very similar usage to Wordpress. You can use shortcodes to develop your own 
customized HTML output for the content. Although no shortcode is embedded into fil, `fil-starter-project` comes with
some shortcodes that can be found in `/template/tags`. While writing content, a shortcode is used like this:
 
`#[short-code-name value-to-send-to-shortcode]`

For instance:

`#[youtube https://www.youtube.com/watch?v=Wq4M8InGw9g]`

**TODO** sending more than one parameter to tags is not supported at this moment. :(

## Design Decisions
### Why not HTML?
Because HTML is hard to write and maintain. We believe **data** and **representation** are different things. We want 
users to focus only about their content, not HTML gotchas. This system is designed to be used not only by engineers,
but also by designers, marketing and content teams!
 
### Why not markdown?
That is a good one as Markdown is an awesome language. Unfortunately, Markdown doesn't have support for adding 
classes to blocks, adding attributes (such as marking a link with **new-tab**), embedding youtube videos etc. out
of the box.
  
We researched a lot to find a way to 'extend' markdown with our constructs. We evaluated almost all nodejs libraries
that provides markdown support and their extendability. In the end, due to the way it implemented, we choose 
[rho](https://github.com/inca/rho) as our library and extended rho with our constructs. Although it is 
**not markdown** it is **so close** to markdown that, we even preferred to use **.md** extension everywhere.
