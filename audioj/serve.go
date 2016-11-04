package main

import (
	"flag"
	"log"

	"github.com/gin-gonic/gin"
)

var addr string

func init() {
	flag.StringVar(&addr, "addr", "localhost:8000", "host:port to listen on. defaults to localhost:8000")
}

func main() {
	flag.Parse()
	log.Println(addr)

	// spin up a server
	router := gin.Default()
	router.LoadHTMLGlob("./templates/*.html")

	router.GET("/", index)
	router.GET("/tones", emit)
	router.GET("/mic", recv)

	router.Static("/static", "./static/")

	router.Run(addr)

}

func index(c *gin.Context) {
	payload := gin.H{
		"title": "NoiseMaker",
	}
	c.HTML(200, "home", payload)
}

func emit(c *gin.Context) {
	payload := gin.H{
		"title": "Make Noise",
	}
	c.HTML(200, "tones", payload)
}

func recv(c *gin.Context) {
	payload := gin.H{
		"title": "Hear Noise",
	}
	c.HTML(200, "mic", payload)
}
