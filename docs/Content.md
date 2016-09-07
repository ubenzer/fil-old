"Content" is a bundle of data that represents some entity. It can be a blog post,
a piece of headline or a custom type. Granularity of content is up to user.

They are organized via "taxonomies".

A content has:
  * Front matter
  * Primary data
  * Other data

Front matter contains:

`created` (required) Create date for this content.

`edited` Last edit date for this content.

`taxonomy` A tree of collections, categories and sub categories that is used to organize this content.

`render` (default true) Is used to disable rendering this content to its own page. 
