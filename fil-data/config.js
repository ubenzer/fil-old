"use strict";
var config = {
  collections: {
    config: {
      collectionsPermalink: "/collections",
      collectionPermalink: "/:collection",
      categoryFirstPermalink: "/:collection/:category",
      categoryPermalink: "/:collection/:category/:page",
      pagination: 4,
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
        },
        categoryFirstPermalink: "/",
        categoryPermalink: "/:page"
        // categoryIdToNameFn: string => string
      },
      {
        id: "monthly",
        categoryFn: function (content) {
          return [content.createDate.year() + "/" + (content.createDate.month()+1)];
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
    dateFormat: "LL",
    locale: "tr",
    siteName: "UBenzer",
    readContent: "Devamını Oku"
  },
  content: {
    permalink: "/:year/:month/:title", // permalink for content folder. it'll create index.html
    templateOptions: {
      // template spesific json customFn(content) return object
    }
  }
};

module.exports = config;
