function ready(fn) {
  if (document.readyState != 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

ready(function() {
  document.querySelectorAll("article.excerpt").forEach(
    function(articleDOM) {
      var id = articleDOM.getAttribute("id").replace(new RegExp("/", "g"), "___");

      firebase.database().ref("comments/byPost/" + id)
        .once('value')
        .then(function(snapshot) {
          articleDOM.querySelector(".comment-count").innerText = Object.keys(snapshot.val()).length;
        });
    }
  );

});
