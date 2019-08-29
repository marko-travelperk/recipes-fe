import React from 'react';
import {cleanup, render, fireEvent} from '@testing-library/react'
import "@testing-library/jest-dom/extend-expect";
import App, {RecipeForm} from '../App';
import {wait} from "@testing-library/dom";
import { withRouter } from 'react-router'
import { createMemoryHistory } from 'history'
import { Link, Route, Router, Switch } from 'react-router-dom'

const mockResponse = (status, statusText, response) => {
    return new Response(response, {
        status: status,
        statusText: statusText,
        headers: {
            'Content-type': 'application/json'
        }
    });
};


function renderWithRouter(
    ui,
    {
        route = '/',
        history,
    } = {}
) {
    const localhistory = history || createMemoryHistory({ initialEntries: [route] });
    return {
        ...render(<Router history={localhistory}>{ui}</Router>), localhistory
    }
}
beforeEach(()=> {
    cleanup();
})
afterEach(() => {
    fetch.mockReset();
})

test('render query', async () => {
    const jsonstr = "[{\"id\":2,\"name\":\"Taco\",\"procedure\":\"put in shell\",\"ingredients\":[{\"id\":53,\"name\":\"tortilla\"},{\"id\":54,\"name\":\"meat\"},{\"id\":55,\"name\":\"beans\"}]},{\"id\":3,\"name\":\"Taco\",\"procedure\":\"Mix\",\"ingredients\":[{\"id\":81,\"name\":\"Tortilla\"},{\"id\":82,\"name\":\"meat\"},{\"id\":83,\"name\":\"cheese\"}]},{\"id\":4,\"name\":\"Taco\",\"procedure\":\"Mix\",\"ingredients\":[{\"id\":60,\"name\":\"Tortilla\"},{\"id\":61,\"name\":\"meat\"},{\"id\":62,\"name\":\"cheese\"}]}]"

    fetch = jest.fn().mockImplementation(() => Promise.resolve(mockResponse(200, null, jsonstr)));

    const {debug, getByTestId, findByTestId} = renderWithRouter(<App></App>);

    const filter = getByTestId('filtertext');
    fireEvent.change(filter, {target: {value: 'Tac'}});


    expect(filter.value).toBe("Tac");
    await wait(() => expect(fetch).toHaveBeenCalledWith("http://localhost:8000/recipes/?q=Tac", {"headers": {"Content-Type": "application/json"}}));
    expect(getByTestId('resultTable').children[0].children.length).toBe(4);

    const errorlabel = await findByTestId('recipelisterror');
    await wait(() => expect(errorlabel).toHaveTextContent("OK"));
});

it('handle server error', async () => {
    const jsonstr = "[]"

    fetch = jest.fn().mockImplementation(() => Promise.resolve(mockResponse(500, "Error", jsonstr)));

    const {debug, getByTestId, getAllByTestId, findByTestId, waitForElement} = renderWithRouter(<App/>);
    const table = getByTestId('resultTable');
    expect(fetch).toHaveBeenCalled();

    const errorlabel = await findByTestId('recipelisterror');
    // debug();
    await wait(() => expect(errorlabel).toHaveTextContent("500 Error"));
});

it('render table from response', async () => {
    const jsonstr = "[{\"id\":1,\"name\":\"Salad\",\"procedure\":\"fasfasdf\",\"ingredients\":[{\"id\":10,\"name\":\"lettuce\"},{\"id\":11,\"name\":\"dressing\"},{\"id\":12,\"name\":\"chicken\"}]},{\"id\":2,\"name\":\"Taco\",\"procedure\":\"put in shell\",\"ingredients\":[{\"id\":53,\"name\":\"tortilla\"},{\"id\":54,\"name\":\"meat\"},{\"id\":55,\"name\":\"beans\"}]},{\"id\":3,\"name\":\"Taco\",\"procedure\":\"Mix\",\"ingredients\":[{\"id\":81,\"name\":\"Tortilla\"},{\"id\":82,\"name\":\"meat\"},{\"id\":83,\"name\":\"cheese\"}]},{\"id\":4,\"name\":\"Taco\",\"procedure\":\"Mix\",\"ingredients\":[{\"id\":60,\"name\":\"Tortilla\"},{\"id\":61,\"name\":\"meat\"},{\"id\":62,\"name\":\"cheese\"}]}]"

    fetch = jest.fn().mockImplementation(() => Promise.resolve(mockResponse(200, null, jsonstr)));

    const {debug, getByTestId, getAllByTestId} = renderWithRouter(<App/>);
    const table = getByTestId('resultTable');


    expect(fetch).toHaveBeenCalled();
    await wait(() => expect(table.children[0].children.length).not.toBe(1));
    expect(table.children[0].children.length).toBe(5);
    expect(getAllByTestId('editButton').length).toBe(4);
});

it('render empty table', async () => {
    const jsonstr = "[]"

    fetch = jest.fn().mockImplementation(() => Promise.resolve(mockResponse(200, null, jsonstr)));

    const {debug, getByTestId, getAllByTestId, findByTestId, waitForElement} = renderWithRouter(<App/>);
    const table = getByTestId('resultTable');
    expect(fetch).toHaveBeenCalled();

    const errorlabel = await findByTestId('recipelisterror');
    // debug();
    await wait(() => expect(errorlabel).toHaveTextContent("OK"));
});

it('create recipe', () => {
    const {getByTestId} = render(<RecipeForm/>);
    const form = getByTestId("recipe-form");
    const name = getByTestId("nameinput");
    const procedure = getByTestId("procedureinput");
    const ingredients = getByTestId("ingredientsinput");
    const errorstring = getByTestId("recipeviewerror");

    fetch = jest.fn().mockImplementation(() => Promise.resolve(mockResponse(200, null, jsonstr)));

    fireEvent.submit(form);
    expect(fetch).not.toHaveBeenCalled();

    fireEvent.change(name, {target: {value: "name"}})
    fireEvent.change(procedure, {target: {value: "procedure"}})
    fireEvent.change(ingredients, {target: {value: "ing1,ing2,ing3"}})

    fireEvent.submit(form);
    expect(fetch).toHaveBeenCalled();
    expect(errorstring).toHaveTextContent("")
});


it('handle error when creating recipe', async () => {
    const {getByTestId} = render(<RecipeForm/>);
    const form = getByTestId("recipe-form");
    const name = getByTestId("nameinput");
    const procedure = getByTestId("procedureinput");
    const ingredients = getByTestId("ingredientsinput");
    const errorstring = getByTestId("recipeviewerror");

    const jsonstr = ""
    fetch = jest.fn().mockImplementation(() => Promise.resolve(mockResponse(500, "error", jsonstr)));

    fireEvent.submit(form);
    expect(fetch).not.toHaveBeenCalled();

    fireEvent.change(name, {target: {value: "name"}})
    fireEvent.change(procedure, {target: {value: "procedure"}})
    fireEvent.change(ingredients, {target: {value: "ing1,ing2,ing3"}})

    fireEvent.submit(form);
    expect(fetch).toHaveBeenCalled();

    await wait(() => expect(errorstring).toHaveTextContent("error"));
});

it('delete recipe', async () => {
    const jsonstr = "[{\"id\":1,\"name\":\"Salad\",\"procedure\":\"fasfasdf\",\"ingredients\":[{\"id\":10,\"name\":\"lettuce\"},{\"id\":11,\"name\":\"dressing\"},{\"id\":12,\"name\":\"chicken\"}]},{\"id\":2,\"name\":\"Taco\",\"procedure\":\"put in shell\",\"ingredients\":[{\"id\":53,\"name\":\"tortilla\"},{\"id\":54,\"name\":\"meat\"},{\"id\":55,\"name\":\"beans\"}]},{\"id\":3,\"name\":\"Taco\",\"procedure\":\"Mix\",\"ingredients\":[{\"id\":81,\"name\":\"Tortilla\"},{\"id\":82,\"name\":\"meat\"},{\"id\":83,\"name\":\"cheese\"}]},{\"id\":4,\"name\":\"Taco\",\"procedure\":\"Mix\",\"ingredients\":[{\"id\":60,\"name\":\"Tortilla\"},{\"id\":61,\"name\":\"meat\"},{\"id\":62,\"name\":\"cheese\"}]}]"

    fetch = jest.fn().mockImplementation(() => Promise.resolve(mockResponse(200, null, jsonstr)));

    const {debug, getByTestId, getAllByTestId, findByTestId} = renderWithRouter(<App/>);
    const table = getByTestId('resultTable');


    expect(fetch).toHaveBeenCalled();
    await wait(() => expect(table.children[0].children.length).not.toBe(1));

    const editButtons = getAllByTestId('editButton');
    expect(editButtons.length).toBe(4);

    fireEvent.click(editButtons[0]);

    fetch.mockClear();
    const deleteButton = getAllByTestId('deletebtn');
    fireEvent.click(deleteButton[0]);
    expect(fetch).toHaveBeenCalledWith("http://localhost:8000/recipes/1/", {"method": "DELETE"});

    //check redirect
    await findByTestId("resultTable")

    await wait(expect(fetch).toHaveBeenLastCalledWith("http://localhost:8000/recipes/", {"headers": {"Content-Type": "application/json"}}));
});

it('handle error when deleting recipe', async () => {
    const jsonstr = "[{\"id\":1,\"name\":\"Salad\",\"procedure\":\"fasfasdf\",\"ingredients\":[{\"id\":10,\"name\":\"lettuce\"},{\"id\":11,\"name\":\"dressing\"},{\"id\":12,\"name\":\"chicken\"}]},{\"id\":2,\"name\":\"Taco\",\"procedure\":\"put in shell\",\"ingredients\":[{\"id\":53,\"name\":\"tortilla\"},{\"id\":54,\"name\":\"meat\"},{\"id\":55,\"name\":\"beans\"}]},{\"id\":3,\"name\":\"Taco\",\"procedure\":\"Mix\",\"ingredients\":[{\"id\":81,\"name\":\"Tortilla\"},{\"id\":82,\"name\":\"meat\"},{\"id\":83,\"name\":\"cheese\"}]},{\"id\":4,\"name\":\"Taco\",\"procedure\":\"Mix\",\"ingredients\":[{\"id\":60,\"name\":\"Tortilla\"},{\"id\":61,\"name\":\"meat\"},{\"id\":62,\"name\":\"cheese\"}]}]"
    fetch = jest.fn().mockImplementation(() => Promise.resolve(mockResponse(200, "error", jsonstr)));
    const {debug, getByTestId, getAllByTestId, findByTestId} = renderWithRouter(<App/>);
    const table = getByTestId('resultTable');
    expect(fetch).toHaveBeenCalled();
    await wait(() => expect(table.children[0].children.length).not.toBe(1));
    const editButtons = getAllByTestId('editButton');
    expect(editButtons.length).toBe(4);

    // redirect to delete
    fireEvent.click(editButtons[0]);

    fetch.mockReset();
    fetch = jest.fn().mockImplementation(() => Promise.resolve(mockResponse(404, "error", jsonstr)));
    const errorstring = getByTestId("recipeviewerror");
    const deleteButton = getAllByTestId('deletebtn');
    fireEvent.click(deleteButton[0]);

    expect(fetch).toHaveBeenCalledWith("http://localhost:8000/recipes/1/", {"method": "DELETE"});
    await wait(() => expect(errorstring).toHaveTextContent("error"));
    render(<App/>)
});


it('edit recipe', async () => {
    const jsonstr = "[{\"id\":1,\"name\":\"Salad\",\"procedure\":\"fasfasdf\",\"ingredients\":[{\"id\":10,\"name\":\"lettuce\"},{\"id\":11,\"name\":\"dressing\"},{\"id\":12,\"name\":\"chicken\"}]},{\"id\":2,\"name\":\"Taco\",\"procedure\":\"put in shell\",\"ingredients\":[{\"id\":53,\"name\":\"tortilla\"},{\"id\":54,\"name\":\"meat\"},{\"id\":55,\"name\":\"beans\"}]},{\"id\":3,\"name\":\"Taco\",\"procedure\":\"Mix\",\"ingredients\":[{\"id\":81,\"name\":\"Tortilla\"},{\"id\":82,\"name\":\"meat\"},{\"id\":83,\"name\":\"cheese\"}]},{\"id\":4,\"name\":\"Taco\",\"procedure\":\"Mix\",\"ingredients\":[{\"id\":60,\"name\":\"Tortilla\"},{\"id\":61,\"name\":\"meat\"},{\"id\":62,\"name\":\"cheese\"}]}]"

    fetch = jest.fn().mockImplementation(() => Promise.resolve(mockResponse(200, null, jsonstr)));

    const {debug, getByTestId, getAllByTestId, findByTestId} = render(<App/>);
    const table = getByTestId('resultTable');


    expect(fetch).toHaveBeenCalled();
    await wait(() => expect(table.children[0].children.length).not.toBe(1));

    const editButtons = getAllByTestId('editButton');
    expect(editButtons.length).toBe(4);

    fireEvent.click(editButtons[0]);

    fetch.mockClear();

    const form = getByTestId("recipe-form");
    const name = getByTestId("nameinput");
    const procedure = getByTestId("procedureinput");
    const ingredients = getByTestId("ingredientsinput");
    const errorstring = getByTestId("recipeviewerror");

    await wait(() => expect(name).toHaveValue("Salad"))
    await wait(() => expect(procedure).toHaveValue("fasfasdf"))
    await wait(() => expect(ingredients).toHaveValue("lettuce,dressing,chicken"))

    fireEvent.change(name, {target: {value: "name"}})
    fireEvent.change(procedure, {target: {value: "procedure"}})
    fireEvent.change(ingredients, {target: {value: "ing1,ing2,ing3"}})

    const deleteButton = getAllByTestId('createrecipebtn');
    fireEvent.click(deleteButton[0]);
    expect(fetch).toHaveBeenCalledWith("http://localhost:8000/recipes/1/", {
        "body": "{\"name\":\"name\",\"procedure\":\"procedure\",\"ingredients\":[{\"name\":\"ing1\"},{\"name\":\"ing2\"},{\"name\":\"ing3\"}],\"id\":\"1\"}",
        "headers": {"Content-Type": "application/json"},
        "method": "PUT"
    });

    //check redirect
    await findByTestId("resultTable")
    await wait(expect(fetch).toHaveBeenCalledWith("http://localhost:8000/recipes/", {"headers": {"Content-Type": "application/json"}}));
});


it('handle error when editing recipe', async () => {
    const jsonstr = "[{\"id\":1,\"name\":\"Salad\",\"procedure\":\"fasfasdf\",\"ingredients\":[{\"id\":10,\"name\":\"lettuce\"},{\"id\":11,\"name\":\"dressing\"},{\"id\":12,\"name\":\"chicken\"}]},{\"id\":2,\"name\":\"Taco\",\"procedure\":\"put in shell\",\"ingredients\":[{\"id\":53,\"name\":\"tortilla\"},{\"id\":54,\"name\":\"meat\"},{\"id\":55,\"name\":\"beans\"}]},{\"id\":3,\"name\":\"Taco\",\"procedure\":\"Mix\",\"ingredients\":[{\"id\":81,\"name\":\"Tortilla\"},{\"id\":82,\"name\":\"meat\"},{\"id\":83,\"name\":\"cheese\"}]},{\"id\":4,\"name\":\"Taco\",\"procedure\":\"Mix\",\"ingredients\":[{\"id\":60,\"name\":\"Tortilla\"},{\"id\":61,\"name\":\"meat\"},{\"id\":62,\"name\":\"cheese\"}]}]"

    fetch = jest.fn().mockImplementation(() => Promise.resolve(mockResponse(200, null, jsonstr)));

    const {debug, getByTestId, getAllByTestId, findByTestId, localhistory} = renderWithRouter(<App/>);

    console.log(localhistory.location.pathname)
    const table = getByTestId('resultTable');


    expect(fetch).toHaveBeenCalled();
    await wait(() => expect(table.children[0].children.length).not.toBe(1));

    const editButtons = getAllByTestId('editButton');
    expect(editButtons.length).toBe(4);

    fireEvent.click(editButtons[0]);

    fetch.mockReset();

    fetch = jest.fn().mockImplementation(() => Promise.resolve(mockResponse(500, "error", jsonstr)));
    const form = getByTestId("recipe-form");
    const name = getByTestId("nameinput");
    const procedure = getByTestId("procedureinput");
    const ingredients = getByTestId("ingredientsinput");
    const errorstring = getByTestId("recipeviewerror");

    await wait(() => expect(name).toHaveValue("Salad"))
    await wait(() => expect(procedure).toHaveValue("fasfasdf"))
    await wait(() => expect(ingredients).toHaveValue("lettuce,dressing,chicken"))

    fireEvent.change(name, {target: {value: "name"}})
    fireEvent.change(procedure, {target: {value: "procedure"}})
    fireEvent.change(ingredients, {target: {value: "ing1,ing2,ing3"}})

    const deleteButton = getAllByTestId('createrecipebtn');
    fireEvent.click(deleteButton[0]);
    expect(fetch).toHaveBeenCalledWith("http://localhost:8000/recipes/1/", {
        "body": "{\"name\":\"name\",\"procedure\":\"procedure\",\"ingredients\":[{\"name\":\"ing1\"},{\"name\":\"ing2\"},{\"name\":\"ing3\"}],\"id\":\"1\"}",
        "headers": {"Content-Type": "application/json"},
        "method": "PUT"
    });

    await wait(() => expect(errorstring).toHaveTextContent("500 error"));
});
