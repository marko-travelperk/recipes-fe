import React, { Component } from 'react';
import './App.css';
import {BrowserRouter as Router, Route, Link, Redirect} from 'react-router-dom'
import {CenterDiv, Button, StyledRow, StyledTable, THeader} from './MyStyledComponents'

class RecipeForm extends Component{
    _isMounted = false;
    componentWillUnmount() {
        this._isMounted = false;
    }
    constructor(props) {
        super(props);
        this._isMounted = true;
        if(props.recipe != undefined ){
            this.state = {
                recipeId: props.recipeId == undefined ? -1 : props.recipeId,
                recipe: props.recipe,
                redirect:false,
                errorString: ""
            }
        }
        else if(!isNaN(props.recipeId) && props.recipeId != -1){
            this.state = {
                recipeId: props.recipeId,
                recipe : {},
                redirect:false,
                errorString: ""
            }
            this.fetchRecipe(props.recipeId);
        }
        else {
            this.state = {
                recipeId:-1,
                recipe: {},
                redirect:false,
                errorString: ""
            }
        }
    }

    fetchRecipe(recipeId){
        let that = this;
        if(isNaN(recipeId) || recipeId < 0){
            return;
        }

        fetch('http://localhost:8000/recipes/' + recipeId + '/', {headers: {
                'Content-Type': 'application/json'
            }})
            .then((response) => {
                if (!response.ok) alert(response.statusText);
                else return response.json();
            })
            .then(
                responsejson  => {
                    if(responsejson != undefined) {
                        responsejson.ingredients = responsejson.ingredients.map(x => x.name);
                        if(that._isMounted) {
                            that.setState(
                                {recipe: responsejson, errorString: ""})
                        }
                    }
                    else{
                        if(that._isMounted) that.setState({redirect: true});
                    }
                })
            .catch(err => {if(that._isMounted) that.setState({errorString: err.toString()}); alert(err)})
    }


    editRecipe(propName, propValue){

        let newRecipe = this.state.recipe;

        newRecipe[propName] = propValue;

        this.setState({
            recipe : newRecipe
        });
    }

    send = event => {
        event.preventDefault();
        let that = this;

        let requestObj = {
            name: this.state.recipe.name,
            procedure : this.state.recipe.procedure,
            ingredients : this.state.recipe.ingredients.map(
                x => {
                    return {
                        name: x
                    }
                }
            )
        }
        let method = 'POST';
        let uri = 'http://localhost:8000/recipes/';

        if(this.state.recipeId != -1){
            requestObj.id = this.state.recipeId;
            method = 'PUT'
            uri = 'http://localhost:8000/recipes/'+this.state.recipeId + '/';
        }
        let body = JSON.stringify(requestObj);
        fetch(uri, {
            method: method,
            headers:{
                'Content-Type': 'application/json'
            },
            body: body
        }).then(
            response => {
            if(!response.ok) {
                throw (response.status + " " + response.statusText)
            }
            that.setState({"redirect":true});}
        ).catch(err => {
                that.setState({redirect: false, errorString: err.toString()})
            }
        )
    }

    delete(){
        let that = this;
        let uri = "http://localhost:8000/recipes/" + this.state.recipeId  + "/";
        fetch(uri, {
                method: 'DELETE'
            }).then(response => {if(!response.ok) throw (response.status +" " +response.statusText)}
            ).then( responsejson => {
                if(that._isMounted) that.setState({"redirect":true});
            }).catch(err => {
            if(that._isMounted) that.setState({redirect: false, errorString: err.toString()})
        })
    }

    render() {
        return(
        <CenterDiv>
            {this.state.redirect?(<Redirect to={{pathname:'/', state: { refresh: true }}}/>) : null}
            <form onSubmit={this.send} data-testid={"recipe-form"}>
                <h2><b>{this.state.recipeId != -1? "Currently editing recipe no" + this.state.recipeId : "Create new recipe"}</b></h2>
                <b>Name:</b> <br/><input type type={"text"} value={this.state.recipe.name} onChange={event => this.editRecipe("name", event.target.value)} required={true} data-testid={"nameinput"}/> <br/>
                <b>Procedure: </b><br/><input type type={"text"} value={this.state.recipe.procedure}
                                              onChange={
                                                  event => this.editRecipe("procedure", event.target.value)
                                              } required={true} data-testid={"procedureinput"}/> <br/>
                <b>Ingredients (comma separated):</b><br/> <input type type={"text"} value={this.state.recipe.ingredients}
                                                      onChange={
                                                          event => {
                                                              let ingredients = event.target.value.replace(/ /g, '').split(',');
                                                              this.editRecipe("ingredients", ingredients)
                                                          }
                                                      } data-testid={"ingredientsinput"}/> <br/>
                <Button type={"submit"} value = "Submit" data-testid={"createrecipebtn"}>Submit</Button>
                <div style={{color:"red"}} data-testid={"recipeviewerror"}>{this.state.errorString}</div>
            </form>

            {this.state.recipeId != -1 ? <Button onClick={() => this.delete() } data-testid={"deletebtn"}>Delete</Button>:null}
        </CenterDiv>
        )
    }
}

class App extends Component {
    _isMounted = false;
    constructor(params){
        super(params);
        this._isMounted = true;
        this.state = {
            "loaded" : false,
            "recipes" : []
        }
        this.getRecipes();
    }

    getRecipes(querytext){
        let that = this;
        let uri = 'http://localhost:8000/recipes/';
        if (querytext !== undefined){
            uri+='?q='+querytext;
        }

        fetch(uri, {headers: {
                'Content-Type': 'application/json'
            }})
            .then((response) => {
                if (!response.ok) throw (response.status + " " + response.statusText);
                else return response.json();
            })
            .then(
                responsejson => {
                    let recipes = [];
                    if (responsejson !== undefined && responsejson.length != 0){
                        responsejson.map(recipe => {let ingredientlist = recipe.ingredients.map(x => x.name); recipe.ingredients = ingredientlist; recipes.push(recipe)});
                    }
                    if(that._isMounted) {
                        that.setState(
                            {recipes: recipes, errorString: "OK"})
                    }
                })
        .catch(err => { alert(err); if(that._isMounted) that.setState({errorString: err.toString()});})
    }

    showRecipeTable(allrecipes) {
        return (
            <CenterDiv>
            <StyledTable data-testid={"resultTable"}>
                <tbody>
                <THeader>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Ingredients</th>
                </THeader>
                {
                    allrecipes.map((r) => {

                        return (
                            <StyledRow key={r.id}>
                                <td>{r.name}</td>
                                <td>{r.procedure}</td>
                                <td>{r.ingredients.join(",")}</td>
                                <td>
                                    <Link to={"/edit/" + r.id} data-testid={"editButton"}><Button>Edit</Button></Link>
                                </td>
                            </StyledRow>
                        )
                    })
                }
                </tbody>
            </StyledTable>
                <Button onClick={() => {this.getRecipes();}} data-testid={"fetchButton"}>Get Recipes</Button>
                <Link to={"/create"}><Button data-testid={"newButton"}>New Recipe</Button></Link>
                <input type={"text"} placeholder={"Filter recipes"} onChange={
                    (event) => {
                        this.getRecipes(event.target.value);
                        this.setState({filterText:event.target.value});
                    }} data-testid={"filtertext"}/>

                {this.state.errorString !== undefined?<div style={{color:"red"}} data-testid={"recipelisterror"}>{this.state.errorString}</div>:null}
            </CenterDiv>
        )
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    render() {
    return (
        <Router>
            <ul className="sidenav">
                <li><a href={"/create"} data-testid={"gotocreate"}>Create Recipe</a></li>
                <li><a href={'/'} data-testid={"gohome"}>See Recipe List</a></li>
            </ul>
            <Route path={"/edit/:id"} render={(routeprops)=> (
                <RecipeForm id={"recipeform"} recipe={
                    this.state.recipes.filter(x => x.id == routeprops.match.params.id)[0]
                } recipeId={routeprops.match.params.id}/>
            )}/>
            <Route path={"/create"} render={(routeprops)=> (
                <RecipeForm id={"recipeform"} recipes={this.state.recipes}/>
            )}/>
            <Route path={"/"} exact={true} render={
                ({location}) => {
                    if(location != undefined && location.state != undefined && location.state.refresh) {
                        this.getRecipes();
                        location.state.refresh=false;
                    }
                    return this.showRecipeTable(this.state.recipes);
                }
            } />
        </Router>
    );
  }
}


export default App;
export {RecipeForm};
