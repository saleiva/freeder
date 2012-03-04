
/*
 * GET home page.
 */

exports.articles = function(req, res){
  res.render('articles', { title: 'Your Freeder' })
};