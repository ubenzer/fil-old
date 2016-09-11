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

Compiler **will** fail when there is a link to nonexistent fil resource. No more 404s!

All links can be "flagged" with bunch flags. This flags can be used in templates to do special actions, such as 
opening in new tab, assigning a different class etc.

`[any link](https://ubenzer.com){new, nofollow, other, flags}`
`[any link](@contentid){new}`

#### Images
**TODO** not documented yet. :/

#### Tags
**TODO** not documented yet. :/

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
