# Taxonomy

Taxonomy and collections are used **interchangeably**.

In fil, collections are used to organize all the content a web site has. Collections are defined in `filconfig` 
file. Each collection might contain, one or more category. Each category might contain sub categories. A category is
not existent until a content belongs to that category. Categories and subcategories are dynamically generated.

The way taxonomies used and content is organized is up to user. Using different collections, the content can be
organized based on different aspects. For instance, same contents can be organized by their category, type, people
that are mentioned on that content, by the month they published etc...

User may configure a taxonomy to create **output**, meaning collection is compiled against a template and created 
actual web pages.

## Categories and Subcategories
A content might belong to zero, one or more category or subcategory of a collection. This relationship can be defined
in two ways: a. as a part of content, b. programmatically
 
### Defining category relationship as a part of content
To make a content belong to a category/subcategory of a content, just define this relationship in frontmatter.

For instance:

```
---
created: 2016-07-14
taxonomy:
  type: "blogpost"
  people:
    - Umut Benzer
    - Seyda Benzer
  category:
    - Personal/Vacations/Europe
    - Life
---
# My vacation in Amsterdam was awesome!
```

This piece of content now belongs to "blogpost" category in "type" collection, "Umut Benzer" and "Seyda Benzer" 
category in "people" collection and "Europe" subcategory which is nested in "Vacations" which is nested in 
"Personal" and "Life" category in "category" collection.

**If a content belongs to a subcategory, it automatically belongs to the parent categories.** Because of this, there is
no need to explicitly define "Personal" and "Personal/Vacations" in the example. 

### Defining category relationship programatically
A rule function can be defined in `filconfig` file. It is called for each content with one single argument, content
itself, expected to return an array of category ids that this content belongs to.

Rule function should be used, if it is possible to determine category of a content programatically by checking its
data or metadata. For instance, a category that contains every single content in the system, or a collection that
is organized by the creation date month of the content can be created via writing functions. In the following 
example, contents are organized monthly by their creation date. Each category id contains year/month, making months
subcategory of years.

```js
function (content) {
    return [content.createDate.year() + "/" + (content.createDate.month() + 1)];
}
```
