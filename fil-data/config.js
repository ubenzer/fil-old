"use strict";
var config = {
  collections: {
    config: {
      collectionsPermalink: "/collections/index.html",
      collectionPermalink: "/:collection/index.html",
      categoryFirstPermalink: "/:collection/:category/index.html",
      categoryPermalink: "/:collection/:category/:page/index.html",
      pagination: 2,
      categorySorting: {
        sortBy: "id", // contentCount customFn(content1, content2) return -1. 0, 1
        reverse: true
      },
      contentSorting: {
        sortBy: "date", // id, date, title, customFn(post1, post2) returns -1, 0, 1
        reverse: true
      },
      subCategorySeparator: "/"
    },
    definition: [
      {
        id: "all",
        categoryFn: function () {
          return ["all"]; // returns category id for given content
        },
        templateOptions: {
          test: 123 // template specific json or customFn(content) return object
        }
        // categoryIdToNameFn: string => string
      },
      {
        id: "monthly",
        categoryFn: function (content) {
          return [content.createDate.getMonth() + "/" + content.createDate.getFullYear()];
        },
        categoryIdToNameFn: function (categoryId) {
          return "___" + categoryId + "___";
        }
      },
      {
        id: "category"
      }
    ]
  },
  template: {
    img: [
      {
        id: "big - webp",
        height: 400,
        width: 400,
        extension: "jpg"
      }
    ]
  },
  post: {
    permalink: "/:year/:month/:title", // permalink for content folder. it'll create index.html
    templateOptions: {
      // template spesific json customFn(content) return object
    }
  }
};

module.exports = config;
