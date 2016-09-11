# Content 

`Content` is a bunch of data that represents some entity. It can be anything: a blog post,
a piece of headline or a product that a marketing site has. Granularity of content is up to user.

Each content has a folder of itself. 

**Contents are all about the data that a website has and how it is organized. It has nothing to do with how they are
displayed. It's [template](Template.md)s' job.**

They are organized via [taxonomies](Taxonomies.md)".

A content has:
  * Metadata
  * Data
  
Metadata and data are organized via:
  * Frontmatter
  * Primary data area
  * Content assets
  
You'll learn what do they mean in the following section.

Primary file that holds content data is `index.md` in the content folder. This file must include a frontmatter and
might include a primary data.

Frontmatter contains the following fields:

  * `created` (required) Create date for this content.
  * `edited` Last edit date for this content.
  * `taxonomy` A tree of collections, categories and sub categories that is used to organize this content.
  * `render` (default true) Is used to disable rendering this content to its own page.
  * `data` A key value store (values can be any type, including arrays, objects etc.) to store structured data that
  belongs to this content. This data can be used in `template`s to sort content, display them in a special way.
  
Primary data area starts after frontmatter in the same file. It is basically a free form text area that is parsed
with [rho](Rho.md), which is a very similar language to `markdown` with some additions.

Content assets are other files that are in content folder. These can be anything: Binary files, images, text files...

## In progress
`render` and `data` fields are not implemented yet.
