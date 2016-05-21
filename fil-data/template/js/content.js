function ready(fn) {
  if (document.readyState != 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

ready(function() {
  firebase.database().ref("comments/" + id).orderByKey().once('value').then(function(snapshot) {
    console.log(snapshot.val());
    var html = "";
    snapshot.forEach(function(commentData) {
      comment = commentData.val();
      html += "<h3>" + comment.name + "</h3><p>" + comment.data + "</p>";
    });

    document.getElementById("comments").innerHTML = html;
  });
});
